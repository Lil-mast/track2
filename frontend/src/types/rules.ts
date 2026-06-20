import type { RecoveryAction, RuleOperator, RuleTrigger } from "./index";

export interface LenderRule {
  id: string;
  lenderId: string;
  name: string;
  description: string;
  trigger: RuleTrigger;
  operator: RuleOperator;
  threshold: number;
  action: RecoveryAction;
  priority: number;
  isActive: boolean;
  autoExecute: boolean;
  cooldownDays: number;
  createdAt: string;
  updatedAt: string;
}
