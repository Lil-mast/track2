import type { LoanStatus, RiskLevel } from "./index";

export interface Loan {
  id: string;
  lenderId: string;
  borrowerId: string;
  loanNumber: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  status: LoanStatus;
  riskLevel: RiskLevel;
  originationDate: string;
  maturityDate: string;
  nextPaymentDueDate: string;
  daysOverdue: number;
  missedPaymentsCount: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  collateral?: string;
  purpose: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanSummary {
  id: string;
  loanNumber: string;
  outstandingBalance: number;
  status: LoanStatus;
  daysOverdue: number;
  riskLevel: RiskLevel;
}

export interface LoanWithBorrower extends Loan {
  borrower: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
    riskLevel: RiskLevel;
  };
}

export interface LoanWithDetails extends LoanWithBorrower {
  payments: import("./payment").Payment[];
  recommendations: import("./recovery").RecoveryRecommendationSummary[];
}
