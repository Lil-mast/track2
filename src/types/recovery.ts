import type {
  RecoveryAction,
  RecommendationStatus,
  RiskLevel,
} from "./index";

export interface RecoveryRecommendation {
  id: string;
  lenderId: string;
  loanId: string;
  borrowerId: string;
  action: RecoveryAction;
  status: RecommendationStatus;
  priority: number;
  confidenceScore: number;
  riskLevel: RiskLevel;
  title: string;
  summary: string;
  reasoning: string;
  suggestedScript?: string;
  expectedRecoveryAmount?: number;
  expectedRecoveryRate?: number;
  aiModel: string;
  aiModelVersion: string;
  generatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  executedAt?: string;
  expiresAt: string;
  metadata?: Record<string, unknown>;
}

export interface RecoveryRecommendationSummary {
  id: string;
  action: RecoveryAction;
  status: RecommendationStatus;
  title: string;
  confidenceScore: number;
  generatedAt: string;
}

export interface RecoveryRecommendationWithContext
  extends RecoveryRecommendation {
  loan: {
    id: string;
    loanNumber: string;
    outstandingBalance: number;
    daysOverdue: number;
    status: import("./index").LoanStatus;
  };
  borrower: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
    riskLevel: RiskLevel;
    riskScore: number;
  };
}
