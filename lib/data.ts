export type RiskLevel = "low" | "medium" | "high";

export type RecommendedAction =
  | "Automated Reminder"
  | "Restructuring Call"
  | "Personal Outreach"
  | "Escalate to Collections"
  | "No Action Needed";

export interface Borrower {
  id: string;
  name: string;
  company: string;
  loanAmount: number;
  outstanding: number;
  interestRate: number;
  termProgress: number; // percentage of loan term elapsed
  missedPayments: number;
  riskScore: number; // 0-100, higher = more likely to default
  riskLevel: RiskLevel;
  recommendedAction: RecommendedAction;
  aiInsight: string;
  lastPayment: string;
  nextDue: string;
}

export const borrowers: Borrower[] = [
  {
    id: "BRW-1042",
    name: "Daniel Otieno",
    company: "Otieno Logistics Ltd",
    loanAmount: 85000,
    outstanding: 17200,
    interestRate: 14.5,
    termProgress: 80,
    missedPayments: 2,
    riskScore: 78,
    riskLevel: "high",
    recommendedAction: "Restructuring Call",
    aiInsight:
      "This borrower has missed two payments on a high-interest loan that is 80% through its term. Recommend a restructuring call before escalating to collections.",
    lastPayment: "2026-03-18",
    nextDue: "2026-06-15",
  },
  {
    id: "BRW-1087",
    name: "Sarah Kimani",
    company: "Kimani Fresh Produce",
    loanAmount: 42000,
    outstanding: 31500,
    interestRate: 11.0,
    termProgress: 35,
    missedPayments: 1,
    riskScore: 54,
    riskLevel: "medium",
    recommendedAction: "Automated Reminder",
    aiInsight:
      "One missed payment early in the term with an otherwise consistent history. A friendly automated reminder is likely sufficient at this stage.",
    lastPayment: "2026-04-30",
    nextDue: "2026-06-30",
  },
  {
    id: "BRW-1103",
    name: "James Mwangi",
    company: "Mwangi Hardware Supplies",
    loanAmount: 120000,
    outstanding: 96000,
    interestRate: 12.8,
    termProgress: 25,
    missedPayments: 3,
    riskScore: 86,
    riskLevel: "high",
    recommendedAction: "Personal Outreach",
    aiInsight:
      "Three consecutive missed payments early in a large loan. Repayment pattern suggests cash-flow disruption. Recommend a personal outreach call to assess the situation before any escalation.",
    lastPayment: "2026-02-12",
    nextDue: "2026-06-12",
  },
  {
    id: "BRW-1119",
    name: "Grace Wanjiru",
    company: "Wanjiru Textiles",
    loanAmount: 28000,
    outstanding: 4200,
    interestRate: 10.5,
    termProgress: 90,
    missedPayments: 0,
    riskScore: 12,
    riskLevel: "low",
    recommendedAction: "No Action Needed",
    aiInsight:
      "Consistent on-time payments across the full term with only 15% of the balance remaining. No recovery action needed.",
    lastPayment: "2026-05-28",
    nextDue: "2026-06-28",
  },
  {
    id: "BRW-1156",
    name: "Peter Njoroge",
    company: "Njoroge Auto Parts",
    loanAmount: 65000,
    outstanding: 48750,
    interestRate: 13.2,
    termProgress: 40,
    missedPayments: 1,
    riskScore: 47,
    riskLevel: "medium",
    recommendedAction: "Automated Reminder",
    aiInsight:
      "A single missed payment last month after a year of on-time payments. Schedule an automated reminder ahead of the next due date.",
    lastPayment: "2026-04-15",
    nextDue: "2026-06-15",
  },
  {
    id: "BRW-1178",
    name: "Mary Achieng",
    company: "Achieng Catering Services",
    loanAmount: 18000,
    outstanding: 14400,
    interestRate: 15.0,
    termProgress: 20,
    missedPayments: 2,
    riskScore: 71,
    riskLevel: "high",
    recommendedAction: "Restructuring Call",
    aiInsight:
      "Two missed payments within the first 20% of a high-interest loan term. Early intervention with a restructured payment plan can prevent default.",
    lastPayment: "2026-03-25",
    nextDue: "2026-06-25",
  },
  {
    id: "BRW-1201",
    name: "David Kiprop",
    company: "Kiprop Dairy Cooperative",
    loanAmount: 95000,
    outstanding: 23750,
    interestRate: 11.8,
    termProgress: 75,
    missedPayments: 0,
    riskScore: 18,
    riskLevel: "low",
    recommendedAction: "No Action Needed",
    aiInsight:
      "Strong repayment record with 75% of the term completed and no missed payments. Continue standard monitoring.",
    lastPayment: "2026-05-20",
    nextDue: "2026-06-20",
  },
  {
    id: "BRW-1224",
    name: "Lucy Muthoni",
    company: "Muthoni Pharmacy",
    loanAmount: 52000,
    outstanding: 49400,
    interestRate: 12.0,
    termProgress: 5,
    missedPayments: 1,
    riskScore: 58,
    riskLevel: "medium",
    recommendedAction: "Personal Outreach",
    aiInsight:
      "Missed the very first payment of a new loan. A personal outreach call helps confirm billing details and establish the repayment relationship early.",
    lastPayment: "—",
    nextDue: "2026-06-10",
  },
  {
    id: "BRW-1242",
    name: "Samuel Onyango",
    company: "Onyango Fisheries",
    loanAmount: 38000,
    outstanding: 36100,
    interestRate: 14.0,
    termProgress: 10,
    missedPayments: 4,
    riskScore: 92,
    riskLevel: "high",
    recommendedAction: "Escalate to Collections",
    aiInsight:
      "Four missed payments at the start of the term with no responses to prior reminders or outreach. Escalation to collections is recommended.",
    lastPayment: "—",
    nextDue: "2026-06-08",
  },
  {
    id: "BRW-1267",
    name: "Esther Nyambura",
    company: "Nyambura Beauty Supplies",
    loanAmount: 22000,
    outstanding: 11000,
    interestRate: 10.9,
    termProgress: 50,
    missedPayments: 0,
    riskScore: 22,
    riskLevel: "low",
    recommendedAction: "No Action Needed",
    aiInsight:
      "Halfway through the term with a perfect payment record. No recovery action needed.",
    lastPayment: "2026-05-25",
    nextDue: "2026-06-25",
  },
];

export const recoveryTrend = [
  { month: "Jan", recovered: 184000, atRisk: 96000 },
  { month: "Feb", recovered: 201000, atRisk: 89000 },
  { month: "Mar", recovered: 192000, atRisk: 103000 },
  { month: "Apr", recovered: 226000, atRisk: 84000 },
  { month: "May", recovered: 248000, atRisk: 71000 },
  { month: "Jun", recovered: 263000, atRisk: 64000 },
];

export const riskDistribution = [
  { range: "0-20", label: "Very Low", count: 812 },
  { range: "21-40", label: "Low", count: 654 },
  { range: "41-60", label: "Medium", count: 478 },
  { range: "61-80", label: "High", count: 232 },
  { range: "81-100", label: "Critical", count: 142 },
];

export const actionBreakdown = [
  { action: "Automated Reminder", count: 318 },
  { action: "Restructuring Call", count: 96 },
  { action: "Personal Outreach", count: 64 },
  { action: "Escalate to Collections", count: 27 },
];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function riskColorClass(level: RiskLevel) {
  switch (level) {
    case "low":
      return "bg-primary/10 text-primary";
    case "medium":
      return "bg-warning/10 text-warning";
    case "high":
      return "bg-destructive/10 text-destructive";
  }
}
