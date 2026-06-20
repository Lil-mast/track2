#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { Track2Stack } from "../lib/track2-stack";

const app = new cdk.App();

new Track2Stack(app, "Track2Stack", {
  // London region. Account is taken from the local AWS profile/credentials
  // used at deploy time (CDK_DEFAULT_ACCOUNT), so no account id is hard-coded
  // in this public repo.
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "eu-west-2",
  },
  description:
    "track2 (RecoveryAI) infrastructure — Aurora PostgreSQL Serverless v2 (scale-to-zero) with Data API, least-privilege app-user secret, and Vercel OIDC federation.",
});
