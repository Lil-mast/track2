"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  Bot,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  RefreshCw,
  Scale,
  ScrollText,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { aiActionLabels, recoveryActionLabels } from "@/lib/labels";
import type { RecoveryEngineWorkflowResult } from "@/types/recovery-engine";

interface RecoveryWorkflowPanelProps {
  loanId: string;
  lenderId: string;
  loanNumber: string;
}

function WorkflowStep({
  step,
  title,
  icon: Icon,
  status,
  children,
}: {
  step: number;
  title: string;
  icon: React.ElementType;
  status: "complete" | "active" | "pending";
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
              status === "complete"
                ? "border-primary bg-primary text-primary-foreground"
                : status === "active"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted bg-muted text-muted-foreground"
            }`}
          >
            {status === "complete" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>
          {step < 5 && (
            <div className="w-px flex-1 min-h-[24px] bg-border my-1" />
          )}
        </div>
        <div className="flex-1 pb-8 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              Step {step}
            </span>
            <h4 className="font-semibold">{title}</h4>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function RecoveryWorkflowPanel({
  loanId,
  lenderId,
  loanNumber,
}: RecoveryWorkflowPanelProps) {
  const [workflow, setWorkflow] = useState<RecoveryEngineWorkflowResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runEngine = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recovery/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId, lenderId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Engine failed");
      }
      const data: RecoveryEngineWorkflowResult = await res.json();
      setWorkflow(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [loanId, lenderId]);

  useEffect(() => {
    runEngine();
  }, [runEngine]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recovery Engine Workflow
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            End-to-end simulation for loan {loanNumber}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runEngine}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Re-run Simulation
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !workflow && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Running recovery engine pipeline...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {workflow && (
          <div className="space-y-2">
            {/* Pipeline overview */}
            <div className="hidden md:flex items-center justify-between rounded-lg bg-muted/50 p-4 mb-6 text-xs font-medium">
              {[
                "Input Data",
                "Risk Scoring",
                "AI Recommendation",
                "Rule Validation",
                "Final Action",
                "Audit Log",
              ].map((label, i, arr) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-primary">{label}</span>
                  {i < arr.length - 1 && (
                    <ArrowDown className="h-3 w-3 rotate-[-90deg] text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Input */}
            <WorkflowStep step={1} title="Input Data" icon={FileText} status="complete">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Loan</p>
                  <p className="font-mono font-medium">{workflow.loanNumber}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(workflow.input.totalOutstanding)} outstanding
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Days Overdue</p>
                  <p className="font-bold text-red-600">
                    {workflow.input.daysOverdue}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Payment History</p>
                  <p>
                    {workflow.input.payments.length} payments ·{" "}
                    {workflow.input.missedPaymentsCount} missed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(workflow.input.onTimePaymentRate * 100)}% on-time
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Contact History</p>
                  <p>{workflow.input.contactHistory.length} records</p>
                  {workflow.input.contactHistory[0] && (
                    <p className="text-xs text-muted-foreground truncate">
                      Last: {formatDateTime(workflow.input.contactHistory[0].date)}
                    </p>
                  )}
                </div>
              </div>
            </WorkflowStep>

            {/* Step 2: Risk Scoring */}
            <WorkflowStep step={2} title="Risk Scoring Engine" icon={Scale} status="complete">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Composite Risk Score
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {workflow.riskAssessment.score}
                    </span>
                    <span className="text-muted-foreground">/100</span>
                    <StatusBadge
                      status={workflow.riskAssessment.level}
                      type="risk"
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  {workflow.riskAssessment.factors.map((f) => (
                    <div key={f.factor} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{f.factor}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {f.description}
                        </p>
                      </div>
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden shrink-0">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(f.score * 2.5, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-8 text-right shrink-0">
                        {Math.round(f.score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </WorkflowStep>

            {/* Step 3: AI Recommendation */}
            <WorkflowStep step={3} title="AI Recommendation" icon={Bot} status="complete">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="capitalize text-sm px-3 py-1">
                    {aiActionLabels[workflow.aiRecommendation.recommendedAction]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Risk score: {workflow.aiRecommendation.riskScore}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Reasoning
                  </p>
                  <p className="text-sm leading-relaxed">
                    {workflow.aiRecommendation.reasoning}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Next Step
                  </p>
                  <p className="text-sm">{workflow.aiRecommendation.nextStep}</p>
                </div>
              </div>
            </WorkflowStep>

            {/* Step 4: Rule Validation */}
            <WorkflowStep step={4} title="Business Rule Validation" icon={Shield} status="complete">
              <div className="rounded-lg border p-4 space-y-3">
                {workflow.ruleValidation.matchedRules.length > 0 ? (
                  <div className="space-y-2">
                    {workflow.ruleValidation.matchedRules.map((rule) => (
                      <div
                        key={rule.ruleId}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{rule.ruleName}</p>
                          <p className="text-xs text-muted-foreground">
                            {rule.trigger.replace(/_/g, " ")} = {rule.actualValue}{" "}
                            (threshold: {rule.threshold})
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary">
                            {recoveryActionLabels[rule.suggestedAction]}
                          </Badge>
                          {rule.autoExecute && (
                            <Zap className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No lender rules triggered for this account.
                  </p>
                )}
                <Separator />
                <ul className="space-y-1">
                  {workflow.ruleValidation.validationNotes.map((note, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <ClipboardList className="h-4 w-4 shrink-0 mt-0.5" />
                      {note}
                    </li>
                  ))}
                </ul>
                {workflow.ruleValidation.requiresManualApproval && (
                  <Badge variant="outline" className="text-amber-700 border-amber-300">
                    Manual approval required
                  </Badge>
                )}
              </div>
            </WorkflowStep>

            {/* Step 5: Final Action */}
            <WorkflowStep step={5} title="Final Action" icon={CheckCircle2} status="complete">
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Approved Action</p>
                    <p className="text-lg font-bold">
                      {workflow.finalAction.label}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {workflow.finalAction.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={workflow.finalAction.autoExecute ? "default" : "secondary"}
                    >
                      {workflow.finalAction.autoExecute
                        ? "Auto-Execute Eligible"
                        : "Manual Execution"}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">
                      AI: {workflow.finalAction.aiAction} →{" "}
                      {workflow.finalAction.action.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            </WorkflowStep>

            {/* Step 6: Audit Log */}
            <WorkflowStep step={6} title="Audit Log" icon={ScrollText} status="complete">
              <div className="rounded-lg border p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Audit ID</span>
                  <span className="font-mono">{workflow.auditLogId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Workflow ID</span>
                  <span className="font-mono text-xs">{workflow.workflowId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timestamp</span>
                  <span>{formatDateTime(workflow.timestamp)}</span>
                </div>
                <Separator />
                <p className="text-muted-foreground">
                  Recovery engine workflow logged for compliance. View full trail
                  in{" "}
                  <Link
                    href="/audit-logs"
                    className="text-primary hover:underline font-medium"
                  >
                    Audit Logs
                  </Link>
                  .
                </p>
              </div>
            </WorkflowStep>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
