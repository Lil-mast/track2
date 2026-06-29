"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ScrollText,
  FlaskConical,
  Users,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDateTime } from "@/lib/utils";

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  resource: string;
  severity: string;
  timestamp: string;
}

interface ConsentStats {
  totalRecords: number;
  consented: number;
  revoked: number;
  pending: number;
}

interface ShapValue {
  feature: string;
  shapValue: number;
  direction: string;
}

interface RegulatoryCheck {
  rule: string;
  status: string;
  lastChecked: string;
}

interface ComplianceData {
  logs: AuditLog[];
  consentStats: ConsentStats;
  shapValues: ShapValue[];
  regulatoryChecks: RegulatoryCheck[];
  updatedAt: string;
}

const SEVERITY_STYLE: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-blue-400",
  warning: "bg-amber-400",
  critical: "bg-red-400 animate-pulse",
};

const REG_STATUS_ICON: Record<string, typeof CheckCircle> = {
  pass: CheckCircle,
  warn: AlertTriangle,
  fail: XCircle,
};

const REG_STATUS_COLOR: Record<string, string> = {
  pass: "text-emerald-400",
  warn: "text-amber-400",
  fail: "text-red-400",
};

export default function AuditLogsPage() {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/compliance");
      const json = await res.json();
      setData(json);
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredLogs = (data?.logs ?? []).filter(
    (l) => severityFilter === "all" || l.severity === severityFilter
  );

  const shapBarData = (data?.shapValues ?? []).map((s) => ({
    feature: s.feature.replace(/_/g, " "),
    value: Math.abs(s.shapValue),
    direction: s.direction,
  }));

  const consentPct = data?.consentStats
    ? Math.round((data.consentStats.consented / data.consentStats.totalRecords) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Explainability"
        description="Audit logs, SHAP model explainers, consent records, and regulatory workflow checks"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Live</span>
          <button onClick={fetchData} className="ml-1 p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors" aria-label="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </PageHeader>

      {/* Regulatory checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Regulatory Workflow Checks
          </CardTitle>
          <CardDescription>FDCPA, TCPA, GDPR, ECOA, SR 11-7 — auto-evaluated on every action</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(data?.regulatoryChecks ?? []).map((check) => {
              const Icon = REG_STATUS_ICON[check.status] ?? CheckCircle;
              const color = REG_STATUS_COLOR[check.status] ?? "text-muted-foreground";
              return (
                <div key={check.rule} className="rounded-lg border border-border/50 bg-card/30 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${color} shrink-0`} />
                    <span className={`text-xs font-bold uppercase tracking-wide ${color}`}>{check.status}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground leading-snug">{check.rule}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(check.lastChecked)}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* SHAP explainer */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              SHAP Feature Importance (GBDT v3.1)
            </CardTitle>
            <CardDescription>Absolute SHAP values — contribution of each feature to the risk score</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={shapBarData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={160} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: unknown) => [`${typeof v === "number" ? v.toFixed(3) : v}`, "SHAP Value"]}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-3">
              SHAP (SHapley Additive exPlanations) quantifies each feature&apos;s contribution to the model prediction. Positive = increases risk score; negative = decreases it.
            </p>
          </CardContent>
        </Card>

        {/* Consent stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Consent Records
            </CardTitle>
            <CardDescription>GDPR / TCPA consent status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Consent Rate</p>
                <p className="text-xs font-bold text-foreground">{loading ? "—" : `${consentPct}%`}</p>
              </div>
              <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${consentPct}%` }}
                />
              </div>
            </div>
            {data?.consentStats && (
              <div className="space-y-2">
                {[
                  { label: "Total Records", value: data.consentStats.totalRecords.toLocaleString(), color: "text-foreground" },
                  { label: "Consented", value: data.consentStats.consented.toLocaleString(), color: "text-emerald-400" },
                  { label: "Revoked", value: data.consentStats.revoked.toLocaleString(), color: "text-red-400" },
                  { label: "Pending", value: data.consentStats.pending.toLocaleString(), color: "text-amber-400" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className={`text-sm font-semibold ${row.color}`}>{row.value}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                Audit Log
              </CardTitle>
              <CardDescription>Immutable event trail — all AI decisions, human overrides, and system actions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {(["all", "info", "warning", "critical"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSeverityFilter(f)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors capitalize ${severityFilter === f ? "bg-primary/10 text-primary border-primary/30" : "border-border/50 text-muted-foreground hover:text-foreground"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border/40 p-3 hover:bg-muted/10 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[log.severity] ?? "bg-gray-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-foreground">{log.action}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${SEVERITY_STYLE[log.severity]}`}>
                      {log.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="text-foreground/70">{log.actor}</span>
                    {" · "}
                    <span className="font-mono">{log.resource}</span>
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground shrink-0">{formatDateTime(log.timestamp)}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Showing {filteredLogs.length} of {data?.logs.length ?? 0} events · auto-refreshes every 10s
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
