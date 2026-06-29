import { NextResponse } from "next/server";

const CONNECTOR_BASE = [
  { id: "banking", name: "Core Banking", source: "Temenos T24", type: "banking", recordsToday: 12_408, latencyMs: 42 },
  { id: "bureau", name: "Credit Bureau", source: "Equifax Ignite", type: "credit_bureau", recordsToday: 5_231, latencyMs: 118 },
  { id: "telco", name: "Telco Signals", source: "Twilio Segment", type: "telco", recordsToday: 83_104, latencyMs: 29 },
  { id: "alt", name: "Alt Data", source: "FinScore API", type: "alternative", recordsToday: 44_802, latencyMs: 65 },
  { id: "crm", name: "CRM Events", source: "Salesforce CDC", type: "crm", recordsToday: 3_019, latencyMs: 88 },
];

const FEATURE_PIPELINE = [
  { name: "time_series_balance_30d", status: "live", freshness: "2m ago", model: "GBDT v3.1" },
  { name: "payment_velocity_7d", status: "live", freshness: "2m ago", model: "GBDT v3.1" },
  { name: "behavioral_app_engagement", status: "live", freshness: "5m ago", model: "Survival v1.4" },
  { name: "bureau_distress_flag", status: "live", freshness: "1h ago", model: "GBDT v3.1" },
  { name: "telco_churn_signal", status: "live", freshness: "8m ago", model: "RL Policy v2.0" },
  { name: "bankruptcy_probability", status: "computing", freshness: "—", model: "Survival v1.4" },
  { name: "sentiment_last_contact", status: "live", freshness: "12m ago", model: "NLP Encoder" },
];

export async function GET() {
  const connectors = CONNECTOR_BASE.map((c) => ({
    ...c,
    status: Math.random() > 0.08 ? "healthy" : "degraded",
    recordsToday: c.recordsToday + Math.round(Math.random() * 200 - 100),
    latencyMs: c.latencyMs + Math.round(Math.random() * 10 - 5),
    lastSync: new Date(Date.now() - Math.random() * 120_000).toISOString(),
  }));

  const trendPoints = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    records: Math.round(6000 + Math.random() * 4000),
    errors: Math.round(Math.random() * 40),
  }));

  return NextResponse.json(
    { connectors, features: FEATURE_PIPELINE, trendPoints, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
