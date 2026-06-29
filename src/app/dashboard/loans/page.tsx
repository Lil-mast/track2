"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  DollarSign,
  TrendingDown,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Loan {
  id: string;
  loanNumber: string;
  borrower: string;
  borrowerId: string;
  principal: number;
  outstandingBalance: number;
  interestRate: number;
  status: string;
  daysOverdue: number;
  riskLevel: string;
  product: string;
  originatedAt: string;
  maturityDate: string;
  nextPaymentDate: string;
  recoveryAction: string | null;
}

interface LoanSummary {
  total: number;
  overdue: number;
  current: number;
  watch: number;
  totalPortfolio: number;
}

interface LoanData {
  loans: Loan[];
  summary: LoanSummary;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  overdue: "bg-red-500/10 text-red-400 border-red-500/20",
  current: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  watch: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const ACTION_LABELS: Record<string, string> = {
  legal_notice: "Legal Notice",
  payment_plan: "Payment Plan",
  hardship_review: "Hardship Review",
  phone_call: "Phone Call",
  sms_reminder: "SMS Reminder",
  email_reminder: "Email Reminder",
  collections_referral: "Collections",
};

export default function LoansPage() {
  const [data, setData] = useState<LoanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Loan | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/loans");
      const json = await res.json();
      setData(json);
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = (data?.loans ?? []).filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = l.borrower.toLowerCase().includes(q) || l.loanNumber.toLowerCase().includes(q) || l.product.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const ltvPercent = (loan: Loan) => Math.round((loan.outstandingBalance / loan.principal) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loans"
        description="Full loan portfolio — live data, refreshes every 10 seconds"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Live</span>
          <button onClick={fetchData} className="ml-1 p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors" aria-label="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Total Loans</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{loading ? "—" : data?.summary.total}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{loading ? "—" : data?.summary.overdue}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-muted-foreground">Current</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{loading ? "—" : data?.summary.current}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-muted-foreground">Portfolio</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{loading ? "—" : formatCurrency(data?.summary.totalPortfolio ?? 0)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Loans table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle>Loan Portfolio</CardTitle>
                <CardDescription>Click a row to view full details</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-muted/30 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-36"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-muted/30 border border-border/50 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value="all">All</option>
                  <option value="overdue">Overdue</option>
                  <option value="watch">Watch</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Loan / Borrower</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Balance</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr
                      key={l.id}
                      onClick={() => setSelected(l)}
                      className={`border-b border-border/30 cursor-pointer transition-colors ${selected?.id === l.id ? "bg-primary/5" : "hover:bg-muted/20"}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono text-[10px] text-muted-foreground">{l.loanNumber}</p>
                        <p className="font-medium text-xs text-foreground">{l.borrower}</p>
                        <p className="text-[10px] text-muted-foreground">{l.product}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-foreground">{formatCurrency(l.outstandingBalance)}</p>
                        <p className="text-[10px] text-muted-foreground">{l.interestRate}% APR</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[l.status] ?? ""}`}>
                          {l.status}
                        </span>
                        {l.daysOverdue > 0 && (
                          <p className="text-[10px] text-red-400 mt-1">{l.daysOverdue} DPD</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={l.riskLevel} type="risk" />
                      </td>
                      <td className="px-4 py-3">
                        {l.recoveryAction ? (
                          <span className="text-[10px] font-medium text-primary">{ACTION_LABELS[l.recoveryAction] ?? l.recoveryAction}</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No loans match your search.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Loan Detail
            </CardTitle>
            <CardDescription>Select a row to inspect</CardDescription>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{selected.loanNumber}</p>
                  <p className="text-base font-bold text-foreground mt-0.5">{selected.borrower}</p>
                  <p className="text-xs text-muted-foreground">{selected.product}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Principal", formatCurrency(selected.principal)],
                    ["Outstanding", formatCurrency(selected.outstandingBalance)],
                    ["Interest Rate", `${selected.interestRate}%`],
                    ["LTV", `${ltvPercent(selected)}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border/50 bg-muted/10 p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-bold text-foreground mt-1">{value}</p>
                    </div>
                  ))}
                </div>

                {/* LTV bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Repaid</span>
                    <span>{100 - ltvPercent(selected)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${100 - ltvPercent(selected)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {[
                    ["Originated", selected.originatedAt],
                    ["Maturity", selected.maturityDate],
                    ["Next Payment", selected.nextPaymentDate],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[selected.status] ?? ""}`}>
                    {selected.status}
                  </span>
                  <StatusBadge status={selected.riskLevel} type="risk" />
                </div>

                {selected.daysOverdue > 0 && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-400 shrink-0" />
                    <p className="text-xs text-red-300">{selected.daysOverdue} days past due — recovery action recommended.</p>
                  </div>
                )}

                {selected.recoveryAction && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Active Recovery Action</p>
                    <p className="text-sm font-semibold text-primary">{ACTION_LABELS[selected.recoveryAction] ?? selected.recoveryAction}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a loan to view details.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
