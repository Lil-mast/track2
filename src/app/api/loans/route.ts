import { NextResponse } from "next/server";

const BASE_LOANS = [
  { id: "loan_001", loanNumber: "MCP-2023-004521", borrower: "Apex Logistics Group", borrowerId: "bor_002", principal: 500_000, outstandingBalance: 385_000, interestRate: 8.5, status: "overdue", daysOverdue: 71, riskLevel: "critical", product: "Term Loan", originatedAt: "2023-01-20", maturityDate: "2026-01-20", nextPaymentDate: "2024-06-01", recoveryAction: "legal_notice" },
  { id: "loan_002", loanNumber: "MCP-2024-007834", borrower: "Apex Logistics Group", borrowerId: "bor_002", principal: 150_000, outstandingBalance: 100_000, interestRate: 9.2, status: "overdue", daysOverdue: 41, riskLevel: "high", product: "Revolving Credit", originatedAt: "2024-02-05", maturityDate: "2025-02-05", nextPaymentDate: "2024-06-08", recoveryAction: "sms_reminder" },
  { id: "loan_003", loanNumber: "MCP-2024-003310", borrower: "TechVault Solutions", borrowerId: "bor_005", principal: 200_000, outstandingBalance: 175_000, interestRate: 7.8, status: "current", daysOverdue: 0, riskLevel: "medium", product: "Equipment Loan", originatedAt: "2024-03-01", maturityDate: "2027-03-01", nextPaymentDate: "2024-07-01", recoveryAction: null },
  { id: "loan_004", loanNumber: "MCP-2024-009021", borrower: "GreenLeaf Capital", borrowerId: "bor_006", principal: 100_000, outstandingBalance: 90_000, interestRate: 6.9, status: "current", daysOverdue: 0, riskLevel: "low", product: "Working Capital", originatedAt: "2024-01-08", maturityDate: "2025-07-08", nextPaymentDate: "2024-07-08", recoveryAction: null },
  { id: "loan_005", loanNumber: "MCP-2023-006721", borrower: "Steel & Sons Mfg.", borrowerId: "bor_004", principal: 300_000, outstandingBalance: 250_000, interestRate: 8.1, status: "watch", daysOverdue: 12, riskLevel: "medium", product: "Term Loan", originatedAt: "2023-07-05", maturityDate: "2026-07-05", nextPaymentDate: "2024-06-20", recoveryAction: "email_reminder" },
  { id: "loan_006", loanNumber: "MCP-2023-005544", borrower: "Okafor Retail Group", borrowerId: "bor_007", principal: 400_000, outstandingBalance: 310_000, interestRate: 9.5, status: "overdue", daysOverdue: 55, riskLevel: "high", product: "Term Loan", originatedAt: "2023-05-22", maturityDate: "2026-05-22", nextPaymentDate: "2024-05-22", recoveryAction: "payment_plan" },
  { id: "loan_007", loanNumber: "MCP-2024-011203", borrower: "Sunrise Hospitality LLC", borrowerId: "bor_008", principal: 160_000, outstandingBalance: 140_000, interestRate: 7.5, status: "current", daysOverdue: 0, riskLevel: "medium", product: "SBA Loan", originatedAt: "2024-03-15", maturityDate: "2027-03-15", nextPaymentDate: "2024-07-15", recoveryAction: null },
  { id: "loan_008", loanNumber: "MCP-2023-002233", borrower: "NovaBio Health Sciences", borrowerId: "bor_003", principal: 550_000, outstandingBalance: 420_000, interestRate: 8.8, status: "overdue", daysOverdue: 71, riskLevel: "high", product: "Term Loan", originatedAt: "2023-02-10", maturityDate: "2026-02-10", nextPaymentDate: "2024-05-10", recoveryAction: "hardship_review" },
  { id: "loan_009", loanNumber: "MCP-2022-001890", borrower: "Pacific Builders Inc.", borrowerId: "bor_001", principal: 900_000, outstandingBalance: 780_000, interestRate: 10.2, status: "overdue", daysOverdue: 130, riskLevel: "critical", product: "Construction Loan", originatedAt: "2022-03-14", maturityDate: "2025-03-14", nextPaymentDate: "2024-03-14", recoveryAction: "collections_referral" },
  { id: "loan_010", loanNumber: "MCP-2023-007890", borrower: "Pacific Builders Inc.", borrowerId: "bor_001", principal: 350_000, outstandingBalance: 320_000, interestRate: 9.0, status: "overdue", daysOverdue: 102, riskLevel: "critical", product: "Bridge Loan", originatedAt: "2023-06-01", maturityDate: "2024-06-01", nextPaymentDate: "2024-04-01", recoveryAction: "legal_notice" },
];

export async function GET() {
  const loans = BASE_LOANS.map((l) => ({
    ...l,
    outstandingBalance: l.outstandingBalance + Math.floor(Math.random() * 2_000) - 1_000,
    daysOverdue: l.daysOverdue > 0 ? l.daysOverdue + Math.floor(Math.random() * 2) : 0,
  }));

  const totalPortfolio = loans.reduce((s, l) => s + l.outstandingBalance, 0);
  const overdue = loans.filter((l) => l.status === "overdue").length;
  const current = loans.filter((l) => l.status === "current").length;
  const watch = loans.filter((l) => l.status === "watch").length;

  return NextResponse.json({
    loans,
    summary: { total: loans.length, overdue, current, watch, totalPortfolio },
    updatedAt: new Date().toISOString(),
  });
}
