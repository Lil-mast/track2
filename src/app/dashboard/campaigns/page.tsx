"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Mail,
  Phone,
  Users,
  RefreshCw,
  FlaskConical,
  Clock,
  Play,
  Pause,
  CalendarClock,
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
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateTime } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  sent: number;
  opened: number;
  ptpRate: number;
  abVariant: string | null;
}

interface QueueItem {
  id: string;
  borrower: string;
  channel: string;
  score: number;
  priority: string;
  scheduledAt: string;
}

interface ChannelBreakdown {
  channel: string;
  value: number;
}

interface CampaignData {
  campaigns: Campaign[];
  queue: QueueItem[];
  channelBreakdown: ChannelBreakdown[];
  updatedAt: string;
}

const CHANNEL_META: Record<string, { icon: typeof MessageSquare; color: string; bg: string }> = {
  sms: { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10" },
  email: { icon: Mail, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  voice: { icon: Phone, color: "text-purple-400", bg: "bg-purple-500/10" },
  agent: { icon: Users, color: "text-amber-400", bg: "bg-amber-500/10" },
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const PRIORITY_STYLE: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const PIE_COLORS = ["#3b82f6", "#06b6d4", "#a855f7", "#f59e0b"];

export default function CampaignsPage() {
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
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
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeCampaigns = data?.campaigns.filter((c) => c.status === "active").length ?? 0;
  const totalSent = data?.campaigns.reduce((s, c) => s + c.sent, 0) ?? 0;
  const avgPtp = data?.campaigns.length
    ? (data.campaigns.reduce((s, c) => s + c.ptpRate, 0) / data.campaigns.length)
    : 0;

  const ptpBarData = (data?.campaigns ?? []).map((c) => ({
    name: c.name.split(" ").slice(0, 3).join(" "),
    ptp: Math.round(c.ptpRate * 100),
    channel: c.channel,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign Orchestration"
        description="Rule + ML-based channel sequencing, A/B testing, and prioritization queues"
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
          { label: "Active Campaigns", value: loading ? "—" : activeCampaigns, color: "text-emerald-400" },
          { label: "Total Sent", value: loading ? "—" : totalSent.toLocaleString(), color: "text-blue-400" },
          { label: "Avg PTP Rate", value: loading ? "—" : `${Math.round(avgPtp * 100)}%`, color: "text-cyan-400" },
          { label: "In Queue", value: loading ? "—" : data?.queue.length ?? 0, color: "text-amber-400" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border/50 bg-card/30 p-4">
            <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Channel breakdown pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Channel Distribution</CardTitle>
            <CardDescription>% of outreach by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data?.channelBreakdown ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  nameKey="channel"
                  paddingAngle={3}
                >
                  {(data?.channelBreakdown ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: unknown) => [`${v}%`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {(data?.channelBreakdown ?? []).map((c, i) => (
                <div key={c.channel} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-xs text-muted-foreground">{c.channel} {c.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PTP rate by campaign bar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">PTP Rate by Campaign</CardTitle>
            <CardDescription>Promise-to-pay conversion rate per active sequence</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ptpBarData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: unknown) => [`${v}%`, "PTP Rate"]}
                />
                <Bar dataKey="ptp" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Campaign table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Active Campaigns & A/B Tests
          </CardTitle>
          <CardDescription>ML-sequenced outreach with variant testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.campaigns ?? []).map((c) => {
              const meta = CHANNEL_META[c.channel] ?? CHANNEL_META.sms;
              const Icon = meta.icon;
              const openRate = c.sent > 0 ? Math.round((c.opened / c.sent) * 100) : 0;
              return (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        {c.abVariant && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            Variant {c.abVariant}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.sent.toLocaleString()} sent · {openRate}% open rate
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-emerald-400">{Math.round(c.ptpRate * 100)}%</p>
                      <p className="text-xs text-muted-foreground">PTP rate</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {c.status === "active" ? <Play className="h-3 w-3 text-emerald-400" /> : c.status === "paused" ? <Pause className="h-3 w-3 text-amber-400" /> : <CalendarClock className="h-3 w-3 text-blue-400" />}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[c.status]}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Prioritization Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Outreach Prioritization Queue
          </CardTitle>
          <CardDescription>RL policy-ranked borrowers queued for next contact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.queue ?? []).map((q, i) => {
              const meta = CHANNEL_META[q.channel] ?? CHANNEL_META.sms;
              const Icon = meta.icon;
              return (
                <div key={q.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                    <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{q.borrower}</p>
                      <p className="text-xs text-muted-foreground capitalize">{q.channel} · Score {q.score}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {formatDateTime(q.scheduledAt)}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[q.priority]}`}>
                      {q.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
