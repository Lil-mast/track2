import { NextResponse } from "next/server";

function randomDelta(base: number, pct: number) {
  return Math.round(base + base * (Math.random() * pct * 2 - pct));
}

export async function GET() {
  const stats = {
    totalLoans: randomDelta(14, 0.05),
    activeLoans: randomDelta(3, 0.1),
    overdueLoans: randomDelta(9, 0.1),
    highRiskAccounts: randomDelta(4, 0.15),
    totalOutstanding: randomDelta(3_665_000, 0.02),
    recoveryRate: +(0.75 + Math.random() * 0.08).toFixed(3),
    promisesToPay: randomDelta(22, 0.1),
    campaignsSent: randomDelta(187, 0.05),
    agentHandoffs: randomDelta(8, 0.2),
    avgRiskScore: +(60 + Math.random() * 20).toFixed(1),
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "no-store" },
  });
}
