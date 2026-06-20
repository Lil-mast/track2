import type { RiskLevel, RecoveryAction } from "./index";
import type { LoanWithBorrower } from "./loan";
import type { Payment } from "./payment";

export type AIRecommendedAction = "remind" | "renegotiate" | "escalate";

export interface AIRecommendationOutput {
  recommendedAction: AIRecommendedAction;
  riskScore: number;
  reasoning: string;
  nextStep: string;
}

export interface ContactRecord {
  date: string;
  type: "email" | "phone" | "sms" | "in_person" | "system";
  outcome: "no_response" | "partial_commitment" | "commitment" | "dispute" | "completed";
  notes?: string;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  score: number;
  description: string;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
}

export interface MatchedRule {
  ruleId: string;
  ruleName: string;
  trigger: string;
  threshold: number;
  actualValue: number;
  suggestedAction: RecoveryAction;
  autoExecute: boolean;
  priority: number;
}

export interface RuleValidationResult {
  passed: boolean;
  matchedRules: MatchedRule[];
  adjustedAction: AIRecommendedAction;
  finalRecoveryAction: RecoveryAction;
  validationNotes: string[];
  requiresManualApproval: boolean;
}

export interface WorkflowInputContext {
  loan: LoanWithBorrower;
  payments: Payment[];
  contactHistory: ContactRecord[];
  daysOverdue: number;
  missedPaymentsCount: number;
  totalOutstanding: number;
  onTimePaymentRate: number;
}

export interface FinalAction {
  action: RecoveryAction;
  aiAction: AIRecommendedAction;
  label: string;
  autoExecute: boolean;
  description: string;
}

export interface RecoveryEngineWorkflowResult {
  workflowId: string;
  loanId: string;
  lenderId: string;
  borrowerId: string;
  loanNumber: string;
  timestamp: string;
  input: WorkflowInputContext;
  riskAssessment: RiskAssessment;
  aiRecommendation: AIRecommendationOutput;
  ruleValidation: RuleValidationResult;
  finalAction: FinalAction;
  auditLogId: string;
}

export interface RecommendRequestBody {
  loanId: string;
  lenderId?: string;
}
