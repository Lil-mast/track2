"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Database,
  Activity,
  Cpu,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Zap,
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { formatDateTime } from "@/lib/utils";

interface Connector {
  id: string;
  name: string;
  source: string;
  type: string;
  status: string;
  recordsToday: number;
  latencyMs: number;
  lastSync: string;
}

interface FeaturePipeline {
  name: string;
  status: string;
  freshness: string;
  model: string;
}

interface TrendPoint {
  hour: string;
  records: number;
  errors: number;
}

interface IngestionData {
  connectors: Connector[];
  features: FeaturePipeline[];
  trendPoints: TrendPoint[];
  updatedAt: string;
}

const SOURCE_TYPE_COLORS: Record<string, string> = {
  banking: "text-blue-400",
  credit_bureau: "text-purple-400",
  telco: "text-cyan-400",
  alternative: "text-emerald-400",
  crm: "text-amber-400",
};

const MODEL_COLORS: Record<string, string> = {
  "GBDT v3.1": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Survival v1.4": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "RL Policy v2.0": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "NLP Encoder": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

export default function IngestionPage() {
  const [data, setData] = useState<IngestionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/ingestion/connectors");
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
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalRecordsToday = data?.connectors.reduce((s, c) => s + c.recordsToday, 0) ?? 0;
  const healthyCount = data?.connectors.filter((c) => c.status === "healthy").length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Ingestion & Feature Store"
        description="Live ETL connectors, feature engineering pipelines, and risk signal status"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Live</span>
          <button onClick={fetchData} className="ml-1 p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors" aria-label="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </PageHeader>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Records Today", value: loading ? "—" : totalRecordsToday.toLocaleString(), icon: Database, color: "text-blue-400" },
          { label: "Healthy Connectors", value: loading ? "—" : `${healthyCount} / ${data?.connectors.length ?? 0}`, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Live Features", value: loading ? "—" : `${data?.features.filter((f) => f.status === "live").length} / ${data?.features.length ?? 0}`, icon: Cpu, color: "text-cyan-400" },
          { label: "Avg Ingestion Latency", value: loading ? "—" : `${Math.round((data?.connectors.reduce((s, c) => s + c.latencyMs, 0) ?? 0) / (data?.connectors.length || 1))} ms`, icon: Zap, color: "text-amber-400" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border/50 bg-card/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`h-4 w-4 ${m.color}`} />
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Ingestion trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            24-Hour Ingestion Trend
          </CardTitle>
          <CardDescription>Records processed and error rate by hour</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data?.trendPoints ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Area type="monotone" dataKey="records" stroke="#3b82f6" strokeWidth={2} fill="url(#recGrad)" name="Records" />
              <Area type="monotone" dataKey="errors" stroke="#f43f5e" strokeWidth={1.5} fill="none" name="Errors" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Connectors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Connectors
            </CardTitle>
            <CardDescription>Banking, bureau, telco & alternative data sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.connectors ?? []).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === "healthy" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className={`text-xs truncate ${SOURCE_TYPE_COLORS[c.type] ?? "text-muted-foreground"}`}>{c.source}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-foreground">{c.recordsToday.toLocaleString()} rec</p>
                    <p className="text-xs text-muted-foreground">{c.latencyMs} ms · {c.status === "healthy" ? <span className="text-emerald-400">Healthy</span> : <span className="text-amber-400">Degraded</span>}</p>
                  </div>
                </div>
              ))}
            </div>
            {data?.updatedAt && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">
                Last sync: {formatDateTime(data.updatedAt)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Feature Store */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Feature Store
            </CardTitle>
            <CardDescription>Time-series features, behavioral signals & distress flags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.features ?? []).map((f) => (
                <div key={f.name} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {f.status === "live" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse shrink-0" />
                      )}
                      <p className="text-xs font-mono text-foreground truncate">{f.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-5">Freshness: {f.freshness}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ml-3 ${MODEL_COLORS[f.model] ?? "bg-muted/30 text-muted-foreground border-border"}`}>
                    {f.model}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model types info banner */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { model: "GBDT v3.1", label: "Gradient-Boosted Trees", desc: "Primary credit risk scoring model. Trained on 36-month payment histories with bureau, telco, and alt data features.", color: "border-blue-500/30 bg-blue-500/5" },
              { model: "Survival v1.4", label: "Survival Model", desc: "Time-to-default estimation using Cox PH regression. Outputs probability of default within 30/60/90-day windows.", color: "border-purple-500/30 bg-purple-500/5" },
              { model: "RL Policy v2.0", label: "RL Outreach Policy", desc: "Reinforcement-learning policy that optimizes channel and timing of borrower contact to maximize PTP rate.", color: "border-emerald-500/30 bg-emerald-500/5" },
            ].map((m) => (
              <div key={m.model} className={`rounded-xl border p-4 ${m.color}`}>
                <p className="text-xs font-mono font-bold text-foreground mb-1">{m.model}</p>
                <p className="text-xs font-semibold text-foreground/80 mb-2">{m.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
