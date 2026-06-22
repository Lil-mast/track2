import type { RiskLevel } from "./index";

export interface Borrower {
  id: string;
  lenderId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  riskScore: number;
  riskLevel: RiskLevel;
  totalOutstanding: number;
  activeLoans: number;
  missedPaymentsCount: number;
  lastContactDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BorrowerWithLoans extends Borrower {
  loans: import("./loan").LoanSummary[];
}
