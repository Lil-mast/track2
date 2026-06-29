import { NextResponse } from "next/server";

const AUDIT_LOG_TEMPLATES = [
  { actor: "AI Engine", action: "RECOMMENDATION_GENERATED", resource: "loan/MCP-2022-001890", severity: "info" },
  { actor: "J. Smith", action: "RECOMMENDATION_APPROVED", resource: "rec/rec_003", severity: "info" },
  { actor: "AI Engine", action: "CAMPAIGN_TRIGGERED", resource: "campaign/c1", severity: "info" },
  { actor: "AI Engine", action: "MODEL_SCORED", resource: "borrower/robert-kim", severity: "info" },
  { actor: "System", action: "CONSENT_VERIFIED", resource: "borrower/wei-chen", severity: "info" },
  { actor: "J. Smith", action: "RULE_UPDATED", resource: "rules/max-contact-frequency", severity: "warning" },
  { actor: "AI Engine", action: "ESCALATION_TRIGGERED", resource: "conv/conv_002", severity: "warning" },
  { actor: "System", action: "DATA_ACCESS_AUDIT", resource: "feature-store/bureau", severity: "info" },
  { actor: "AI Engine", action: "SHAP_EXPLANATION_GENERATED", resource: "model/gbdt-v3.1", severity: "info" },
  { actor: "System", action: "REGULATORY_WORKFLOW_PASSED", resource: "loan/MCP-2023-004521", severity: "info" },
  { actor: "J. Smith", action: "MANUAL_OVERRIDE", resource: "rec/rec_001", severity: "warning" },
  { actor: "System", action: "CONSENT_REVOKED", resource: "borrower/alex-torres", severity: "critical" },
];

const SHAP_FEATURES = [
  { feature: "days_overdue", shapValue: 0.34, direction: "negative" },
  { feature: "payment_velocity_7d", shapValue: 0.21, direction: "positive" },
  { feature: "bureau_distress_flag", shapValue: -0.18, direction: "negative" },
  { feature: "telco_churn_signal", shapValue: -0.14, direction: "negative" },
  { feature: "behavioral_app_engagement", shapValue: 0.11, direction: "positive" },
  { feature: "time_series_balance_30d", shapValue: -0.09, direction: "negative" },
  { feature: "sentiment_last_contact", shapValue: 0.07, direction: "positive" },
];

export async function GET() {
  const logs = Array.from({ length: 20 }, (_, i) => {
    const tpl = AUDIT_LOG_TEMPLATES[i % AUDIT_LOG_TEMPLATES.length];
    return {
      id: `log_${String(i + 1).padStart(4, "0")}`,
      ...tpl,
      timestamp: new Date(Date.now() - i * 180_000 - Math.random() * 60_000).toISOString(),
    };
  });

  const consentStats = {
    totalRecords: 14_802 + Math.round(Math.random() * 50),
    consented: 13_941 + Math.round(Math.random() * 30),
    revoked: 312 + Math.round(Math.random() * 5),
    pending: 549 + Math.round(Math.random() * 10),
  };

  const shapValues = SHAP_FEATURES.map((f) => ({
    ...f,
    shapValue: +(f.shapValue + (Math.random() * 0.02 - 0.01)).toFixed(3),
  }));

  const regulatoryChecks = [
    { rule: "FDCPA Max Contact Frequency", status: "pass", lastChecked: new Date(Date.now() - 300_000).toISOString() },
    { rule: "TCPA Consent Verification", status: "pass", lastChecked: new Date(Date.now() - 600_000).toISOString() },
    { rule: "GDPR Data Minimisation", status: "pass", lastChecked: new Date(Date.now() - 900_000).toISOString() },
    { rule: "ECOA Fair Lending Check", status: Math.random() > 0.9 ? "warn" : "pass", lastChecked: new Date(Date.now() - 1_200_000).toISOString() },
    { rule: "Model Explainability (SR 11-7)", status: "pass", lastChecked: new Date(Date.now() - 1_500_000).toISOString() },
  ];

  return NextResponse.json(
    { logs, consentStats, shapValues, regulatoryChecks, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
