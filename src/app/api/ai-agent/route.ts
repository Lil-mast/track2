import { NextResponse } from "next/server";

const CONVERSATIONS = [
  {
    id: "conv_001",
    borrower: "Robert Kim",
    channel: "sms",
    language: "en",
    sentiment: "neutral",
    sentimentScore: 0.51,
    status: "ptp_captured",
    ptpAmount: 5000,
    ptpDate: "2025-07-15",
    summary: "Borrower acknowledged overdue balance. Agreed to partial payment of $5,000 by July 15. No hardship flags detected.",
    escalated: false,
    turns: 6,
    startedAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: "conv_002",
    borrower: "Wei Chen",
    channel: "voice",
    language: "zh",
    sentiment: "distressed",
    sentimentScore: 0.21,
    status: "escalated",
    ptpAmount: null,
    ptpDate: null,
    summary: "Borrower expressed significant financial hardship. Sentiment flagged as distressed. Escalated to human agent for empathetic follow-up.",
    escalated: true,
    turns: 9,
    startedAt: new Date(Date.now() - 7_200_000).toISOString(),
  },
  {
    id: "conv_003",
    borrower: "Marcus Webb",
    channel: "chat",
    language: "en",
    sentiment: "cooperative",
    sentimentScore: 0.78,
    status: "ptp_captured",
    ptpAmount: 12_000,
    ptpDate: "2025-07-10",
    summary: "Borrower proactively initiated contact. Full repayment commitment received. High confidence PTP.",
    escalated: false,
    turns: 4,
    startedAt: new Date(Date.now() - 1_800_000).toISOString(),
  },
  {
    id: "conv_004",
    borrower: "Sarah Whitfield",
    channel: "sms",
    language: "en",
    sentiment: "unresponsive",
    sentimentScore: 0.12,
    status: "no_response",
    ptpAmount: null,
    ptpDate: null,
    summary: "No response after 3 attempts across SMS. Queued for voice outreach in next cycle.",
    escalated: false,
    turns: 1,
    startedAt: new Date(Date.now() - 10_800_000).toISOString(),
  },
];

export async function GET() {
  const conversations = CONVERSATIONS.map((c) => ({
    ...c,
    sentimentScore: +(c.sentimentScore + (Math.random() * 0.04 - 0.02)).toFixed(2),
  }));

  const sentimentBreakdown = [
    { label: "Cooperative", value: 38 + Math.round(Math.random() * 4 - 2), color: "#10b981" },
    { label: "Neutral", value: 29 + Math.round(Math.random() * 4 - 2), color: "#3b82f6" },
    { label: "Distressed", value: 18 + Math.round(Math.random() * 4 - 2), color: "#f59e0b" },
    { label: "Unresponsive", value: 15 + Math.round(Math.random() * 4 - 2), color: "#6b7280" },
  ];

  const agentActions = [
    { action: "PTP Captured", count: 22 + Math.round(Math.random() * 3), delta: "+3 today" },
    { action: "Escalations", count: 8 + Math.round(Math.random() * 2), delta: "+1 today" },
    { action: "Plans Offered", count: 14 + Math.round(Math.random() * 2), delta: "+2 today" },
    { action: "No Response", count: 31 + Math.round(Math.random() * 3), delta: "-2 today" },
  ];

  return NextResponse.json(
    { conversations, sentimentBreakdown, agentActions, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
