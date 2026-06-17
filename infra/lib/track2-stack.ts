import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

/**
 * track2 (RecoveryAI) infrastructure — Aurora only.
 *
 * SECRET-HANDLING POLICY (this stack never leaks secrets):
 *  - Both DB passwords are generated *inside* AWS Secrets Manager, never in
 *    CDK/CloudFormation. They never appear in the synthesized template, in
 *    cdk.out, in stack outputs, or in deploy logs.
 *  - We output Secrets Manager *ARNs* (addresses), never the secret values.
 *  - There are NO long-lived AWS access keys. Vercel reaches AWS via OIDC
 *    federation: each production deployment presents a short-lived OIDC token
 *    that is exchanged (sts:AssumeRoleWithWebIdentity) for temporary
 *    credentials on the least-privilege role below. Nothing secret is stored
 *    in Vercel, the template, logs, or this repo — only the (non-secret) role
 *    ARN is shared.
 *
 * SECRET SEPARATION (two secrets, two audiences):
 *  - MASTER secret (recoveryai_admin) owns the schema and can run DDL. It is
 *    used ONLY locally by me (migrations / create-app-user). It is NEVER given
 *    to Vercel.
 *  - APP-USER secret (app_user) holds DML-only Postgres privileges. This is the
 *    ONLY secret the Vercel role can read at runtime.
 *
 * Every CfnOutput below is a non-sensitive identifier or ARN.
 */

// Vercel team namespace. Used to build the OIDC issuer URL and the
// trust-policy claim conditions.
const VERCEL_TEAM_SLUG = "tazos-projects-e0fd6b75";
const VERCEL_PROJECT_NAME = "track2";
const VERCEL_OIDC_ISSUER = `oidc.vercel.com/${VERCEL_TEAM_SLUG}`;
const VERCEL_OIDC_AUDIENCE = `https://vercel.com/${VERCEL_TEAM_SLUG}`;

export class Track2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ---------------------------------------------------------------------
    // Networking — minimal, NAT-free VPC. Aurora lives in isolated subnets;
    // the RDS Data API is reached over AWS's service endpoint, so Vercel does
    // not need to be inside the VPC and we incur no NAT Gateway cost.
    // ---------------------------------------------------------------------
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ---------------------------------------------------------------------
    // MASTER credential — generated server-side by Secrets Manager.
    // The plaintext password is never in this code or the template.
    // Used ONLY locally for migrations / DDL. NOT given to Vercel.
    // ---------------------------------------------------------------------
    const dbCredentials = rds.Credentials.fromGeneratedSecret("recoveryai_admin", {
      secretName: "track2/db-credentials",
    });

    // ---------------------------------------------------------------------
    // Aurora PostgreSQL (Serverless v2) with the Data API enabled.
    //
    // Scale-to-zero: serverlessV2MinCapacity = 0 lets the cluster pause to
    // 0 ACU when idle. secondsUntilAutoPause sets the idle window before the
    // cluster pauses (300s = 5 min). The first query after a pause incurs a
    // short cold-start while the cluster resumes.
    // ---------------------------------------------------------------------
    const cluster = new rds.DatabaseCluster(this, "Database", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_6,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      writer: rds.ClusterInstance.serverlessV2("writer"),

      // Scale-to-idle: pause to 0 ACU when inactive.
      serverlessV2MinCapacity: 0,
      serverlessV2MaxCapacity: 2,

      enableDataApi: true, // REQUIRED — the app uses the RDS Data API.
      credentials: dbCredentials,
      defaultDatabaseName: "recoveryai",
      storageEncrypted: true,

      // Hackathon-friendly teardown. Review before using in production.
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // The L2 construct does not yet expose secondsUntilAutoPause for v2
    // scale-to-zero, so set it on the underlying CfnDBCluster. 300s = 5 min
    // idle before the cluster pauses to 0 ACU.
    const cfnCluster = cluster.node.defaultChild as rds.CfnDBCluster;
    cfnCluster.serverlessV2ScalingConfiguration = {
      minCapacity: 0,
      maxCapacity: 2,
      secondsUntilAutoPause: 300,
    };

    // ---------------------------------------------------------------------
    // Least-privilege APP-USER credential.
    //
    // A SECOND Secrets Manager secret for a dedicated `app_user` Postgres role
    // that will hold only DML privileges (SELECT/INSERT/UPDATE/DELETE). The
    // Postgres role and its grants are created AFTER deploy by a local script
    // that reads this secret's generated password (so the password lives only
    // in Secrets Manager and the DB — never in code or the template).
    //
    // The Data API requires the secret JSON to contain `username` + `password`.
    // ---------------------------------------------------------------------
    const appUserSecret = new secretsmanager.Secret(this, "AppUserSecret", {
      secretName: "track2/app-user-credentials",
      description:
        "Least-privilege application DB role (DML only) used by Vercel at runtime.",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "app_user" }),
        generateStringKey: "password",
        // Exclude chars that complicate SQL string literals / URLs / shells.
        excludeCharacters: "\"'`\\/@ {}[]:;",
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // hackathon-friendly teardown
    });

    // ---------------------------------------------------------------------
    // Vercel OIDC federation — identity provider + assumable role.
    //
    // The provider trusts tokens issued by Vercel for this team. The role can
    // be assumed ONLY by production deployments of the track2 project (strict
    // `sub` condition). Preview and local development are excluded — local dev
    // uses its own AWS profile instead.
    // ---------------------------------------------------------------------
    const vercelOidcProvider = new iam.OpenIdConnectProvider(
      this,
      "VercelOidcProvider",
      {
        url: `https://${VERCEL_OIDC_ISSUER}`,
        clientIds: [VERCEL_OIDC_AUDIENCE],
      },
    );

    const vercelRole = new iam.Role(this, "VercelRole", {
      roleName: "track2-vercel",
      description:
        "Assumed by track2 Vercel production deployments via OIDC federation (no static keys).",
      maxSessionDuration: cdk.Duration.hours(1),
      assumedBy: new iam.WebIdentityPrincipal(
        vercelOidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            [`${VERCEL_OIDC_ISSUER}:aud`]: VERCEL_OIDC_AUDIENCE,
            // Strict: track2 project, production environment only.
            [`${VERCEL_OIDC_ISSUER}:sub`]: `owner:${VERCEL_TEAM_SLUG}:project:${VERCEL_PROJECT_NAME}:environment:production`,
          },
        },
      ),
    });

    // Aurora Data API — least privilege on two axes:
    //  (1) DB layer: the app connects as `app_user` (DML only), never the owner.
    //  (2) AWS layer: the role may read ONLY the app_user secret, NOT the master
    //      secret. With the Data API the CALLER must hold GetSecretValue on the
    //      secret ARN it passes, so withholding the master secret means the app
    //      physically cannot authenticate as the schema owner — defense in depth.
    // (We deliberately do NOT use cluster.grantDataApiAccess(), which would also
    //  grant read of the master secret.)
    vercelRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "AuroraDataApi",
        actions: [
          "rds-data:BatchExecuteStatement",
          "rds-data:BeginTransaction",
          "rds-data:CommitTransaction",
          "rds-data:ExecuteStatement",
          "rds-data:RollbackTransaction",
        ],
        resources: [cluster.clusterArn],
      }),
    );

    // GetSecretValue (and DescribeSecret) on the app_user secret ONLY.
    // The master secret is intentionally NOT granted to the Vercel role.
    appUserSecret.grantRead(vercelRole);

    // ---------------------------------------------------------------------
    // Outputs — ALL non-sensitive (identifiers + ARNs only). No secret values.
    // ---------------------------------------------------------------------
    new cdk.CfnOutput(this, "AWSRegion", {
      value: this.region,
      description: "Set as AWS_REGION in Vercel.",
    });

    new cdk.CfnOutput(this, "AuroraClusterArn", {
      value: cluster.clusterArn,
      description: "Set as AURORA_CLUSTER_ARN in Vercel.",
    });

    new cdk.CfnOutput(this, "AuroraSecretArn", {
      // ARN only — this is the address of the secret, NOT the secret value.
      value: cluster.secret?.secretArn ?? "ERROR_NO_SECRET",
      description:
        "MASTER (recoveryai_admin) secret ARN. Use ONLY locally for migrations (AURORA_SECRET_ARN when running migration scripts). Do NOT put this in Vercel.",
    });

    new cdk.CfnOutput(this, "AppUserSecretArn", {
      // ARN only — the address of the least-privilege app_user secret.
      value: appUserSecret.secretArn,
      description:
        "Least-privilege app_user secret ARN. Set as AURORA_SECRET_ARN in Vercel (runtime). Provision the Postgres role first with the local create-app-user script.",
    });

    new cdk.CfnOutput(this, "AuroraDatabaseName", {
      value: "recoveryai",
      description: "Set as AURORA_DATABASE in Vercel.",
    });

    new cdk.CfnOutput(this, "VercelRoleArn", {
      value: vercelRole.roleArn,
      description:
        "Set as AWS_ROLE_ARN in Vercel. Vercel assumes this role via OIDC; no access keys needed.",
    });
  }
}
