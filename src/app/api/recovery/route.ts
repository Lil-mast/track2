import { NextResponse } from "next/server";

const RECOMMENDATIONS = [
  { id: "rec_001", title: "Issue Formal Demand Letter", action: "legal_notice", confidenceScore: 0.92, expectedRecovery: 780_000, priorityScore: 98, borrower: { id: "bor_001", name: "Robert Kim", company: "Pacific Builders Inc." }, loan: { id: "loan_009", number: "MCP-2022-001890", outstanding: 780_000, daysOverdue: 130, riskLevel: "critical" }, rationale: "Account is 130 days overdue with no payment response. Survival model projects 94% probability of default within 60 days. RL policy recommends immediate legal escalation before asset dissipation.", modelSignals: ["Behavioral: 0 logins in 45 days", "Telco: SIM swap detected", "Bureau: 3 new derogatory marks"], status: "pending", generatedAt: "2025-06-08T08:30:00Z" },
  { id: "rec_002", title: "Propose Restructured Payment Plan", action: "payment_plan", confidenceScore: 0.87, expectedRecovery: 385_000, priorityScore: 87, borrower: { id: "bor_002", name: "Wei Chen", company: "Apex Logistics Group" }, loan: { id: "loan_001", number: "MCP-2023-004521", outstanding: 385_000, daysOverdue: 71, riskLevel: "critical" }, rationale: "Cash-flow stress detected in banking transactions — revenue down 38% QoQ. Hardship indicators suggest borrower is willing to pay but liquidity-constrained. A 12-month restructured plan has 74% PTP success probability.", modelSignals: ["Banking: Revenue -38% QoQ", "Alt data: Inventory liquidation", "Bureau: Payment stress flag"], status: "pending", generatedAt: "2025-06-07T14:15:00Z" },
  { id: "rec_003", title: "Conduct Hardship Review Interview", action: "hardship_review", confidenceScore: 0.79, expectedRecovery: 420_000, priorityScore: 74, borrower: { id: "bor_003", name: "Marcus Webb", company: "NovaBio Health Sciences" }, loan: { id: "loan_008", number: "MCP-2023-002233", outstanding: 420_000, daysOverdue: 71, riskLevel: "high" }, rationale: "Borrower sentiment on last AI call: distressed (score 0.28). NLP encoder flagged medical hardship language. A structured interview via human agent can unlock forbearance eligibility and prevent default.", modelSignals: ["Sentiment: Distressed (0.28)", "NLP: Medical hardship language", "Alt data: Insurance claim filed"], status: "approved", generatedAt: "2025-06-06T10:00:00Z" },
  { id: "rec_004", title: "Escalate to Collections Agency", action: "collections_referral", confidenceScore: 0.88, expectedRecovery: 210_000, priorityScore: 71, borrower: { id: "bor_007", name: "James Okafor", company: "Okafor Retail Group" }, loan: { id: "loan_006", number: "MCP-2023-005544", outstanding: 310_000, daysOverdue: 55, riskLevel: "high" }, rationale: "Three prior outreach attempts with no response. Bankruptcy distress flag triggered (score 0.81). Internal recovery probability drops below 40% after 60 DPD for this borrower profile. External agency referral maximizes recovery.", modelSignals: ["Bankruptcy score: 0.81", "3 unanswered outreach attempts", "Credit bureau: 2 active judgments"], status: "pending", generatedAt: "2025-06-06T09:00:00Z" },
  { id: "rec_005", title: "Priority CFO Outbound Call", action: "phone_call", confidenceScore: 0.84, expectedRecovery: 250_000, priorityScore: 62, borrower: { id: "bor_004", name: "Sarah Whitfield", company: "Steel & Sons Mfg." }, loan: { id: "loan_005", number: "MCP-2023-006721", outstanding: 250_000, daysOverdue: 12, riskLevel: "medium" }, rationale: "Early-stage delinquency — 12 DPD. RL policy identifies this as the optimal intervention window. Direct CFO contact has 89% early-resolution rate for this risk tier. Act before account rolls to 30 DPD.", modelSignals: ["12 DPD — optimal intervention window", "RL policy: phone_call score 0.84", "Telco: CFO phone reachable"], status: "executed", generatedAt: "2025-06-05T11:00:00Z" },
  { id: "rec_006", title: "Send SMS Payment Reminder", action: "sms_reminder", confidenceScore: 0.91, expectedRecovery: 100_000, priorityScore: 55, borrower: { id: "bor_002", name: "Wei Chen", company: "Apex Logistics Group" }, loan: { id: "loan_002", number: "MCP-2024-007834", outstanding: 100_000, daysOverdue: 41, riskLevel: "high" }, rationale: "Borrower has historically responded to SMS within 24 hours. Channel preference model (NLP analysis of 14 prior interactions) scores SMS at 0.91. Gentle reminder with payment link may resolve without escalation.", modelSignals: ["Channel preference: SMS (0.91)", "14 prior SMS responses", "Browser: Payment portal visited 3x"], status: "executed", generatedAt: "2025-06-04T09:00:00Z" },
];

const HISTORY = [
  { id: "hist_001", title: "Email Reminder Campaign — Apex Logistics", action: "email_reminder", outcome: "partial_payment", recoveredAmount: 45_000, executedAt: "2025-05-28T10:00:00Z", borrower: "Apex Logistics Group", notes: "Borrower paid partial installment of $45,000 within 48 hours of email." },
  { id: "hist_002", title: "Payment Plan Proposal — NovaBio", action: "payment_plan", outcome: "accepted", recoveredAmount: 0, executedAt: "2025-05-20T14:30:00Z", borrower: "NovaBio Health Sciences", notes: "Borrower accepted 12-month restructured plan. First instalment due 2025-07-01." },
  { id: "hist_003", title: "Legal Demand Letter — Pacific Builders", action: "legal_notice", outcome: "no_response", recoveredAmount: 0, executedAt: "2025-05-15T08:00:00Z", borrower: "Pacific Builders Inc.", notes: "No response within the 14-day response window. Escalation in progress." },
  { id: "hist_004", title: "CFO Call — Steel & Sons", action: "phone_call", outcome: "promise_to_pay", recoveredAmount: 0, executedAt: "2025-06-05T11:00:00Z", borrower: "Steel & Sons Mfg.", notes: "PTP captured: $250,000 by 2025-06-30. Marked for follow-up." },
  { id: "hist_005", title: "SMS Reminder — TechVault Solutions", action: "sms_reminder", outcome: "paid_in_full", recoveredAmount: 175_000, executedAt: "2025-05-10T09:00:00Z", borrower: "TechVault Solutions", notes: "Borrower paid outstanding balance in full within 6 hours of SMS." },
];

export async function GET() {
  const recs = RECOMMENDATIONS.map((r) => ({
    ...r,
    confidenceScore: Math.min(0.99, r.confidenceScore + (Math.random() * 0.04 - 0.02)),
  }));

  return NextResponse.json({
    recommendations: recs,
    history: HISTORY,
    stats: {
      pending: recs.filter((r) => r.status === "pending").length,
      approved: recs.filter((r) => r.status === "approved").length,
      executed: recs.filter((r) => r.status === "executed").length,
      totalExpectedRecovery: recs.filter((r) => r.status === "pending" || r.status === "approved").reduce((s, r) => s + r.expectedRecovery, 0),
    },
    updatedAt: new Date().toISOString(),
  });
}
