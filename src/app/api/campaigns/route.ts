import { NextResponse } from "next/server";

const CAMPAIGNS = [
  { id: "c1", name: "Early Arrears SMS Nudge", channel: "sms", status: "active", sent: 1_204, opened: 718, ptpRate: 0.31, abVariant: "A" },
  { id: "c2", name: "30-Day Overdue Email Series", channel: "email", status: "active", sent: 843, opened: 412, ptpRate: 0.22, abVariant: "B" },
  { id: "c3", name: "Voice IVR Outreach", channel: "voice", status: "active", sent: 312, opened: 198, ptpRate: 0.41, abVariant: "A" },
  { id: "c4", name: "Agent Hand-Off Queue", channel: "agent", status: "active", sent: 87, opened: 87, ptpRate: 0.67, abVariant: null },
  { id: "c5", name: "90+ Day Legal Notice", channel: "email", status: "paused", sent: 55, opened: 22, ptpRate: 0.18, abVariant: "A" },
  { id: "c6", name: "Re-engagement SMS (Lapsed)", channel: "sms", status: "scheduled", sent: 0, opened: 0, ptpRate: 0, abVariant: "B" },
];

const QUEUE = [
  { id: "q1", borrower: "Pacific Builders Inc.", channel: "voice", score: 94, priority: "critical", scheduledAt: new Date(Date.now() + 900_000).toISOString() },
  { id: "q2", borrower: "Apex Logistics Group", channel: "sms", score: 87, priority: "high", scheduledAt: new Date(Date.now() + 1_800_000).toISOString() },
  { id: "q3", borrower: "NovaBio Health Sciences", channel: "email", score: 81, priority: "high", scheduledAt: new Date(Date.now() + 3_600_000).toISOString() },
  { id: "q4", borrower: "Steel & Sons Mfg.", channel: "agent", score: 76, priority: "medium", scheduledAt: new Date(Date.now() + 7_200_000).toISOString() },
  { id: "q5", borrower: "TechVault Solutions", channel: "sms", score: 62, priority: "medium", scheduledAt: new Date(Date.now() + 14_400_000).toISOString() },
];

export async function GET() {
  const campaigns = CAMPAIGNS.map((c) => ({
    ...c,
    sent: c.sent + Math.round(Math.random() * 5),
    opened: c.opened + Math.round(Math.random() * 3),
    ptpRate: c.status === "active" ? +(c.ptpRate + (Math.random() * 0.02 - 0.01)).toFixed(3) : c.ptpRate,
  }));

  const channelBreakdown = [
    { channel: "SMS", value: 48 + Math.round(Math.random() * 4 - 2) },
    { channel: "Email", value: 28 + Math.round(Math.random() * 4 - 2) },
    { channel: "Voice", value: 15 + Math.round(Math.random() * 3 - 1) },
    { channel: "Agent", value: 9 + Math.round(Math.random() * 2 - 1) },
  ];

  return NextResponse.json(
    { campaigns, queue: QUEUE, channelBreakdown, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
