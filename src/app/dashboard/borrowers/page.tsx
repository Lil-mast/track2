"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Search,
  ChevronUp,
  ChevronDown,
  Building2,
  MapPin,
  CreditCard,
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

interface Borrower {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  creditScore: number;
  riskLevel: string;
  totalLoans: number;
  totalOutstanding: number;
  onboardedAt: string;
}

interface BorrowerData {
  borrowers: Borrower[];
  total: number;
  highRisk: number;
  totalExposure: number;
  updatedAt: string;
}

type SortKey = "company" | "creditScore" | "totalOutstanding" | "riskLevel";

const RISK_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function BorrowersPage() {
  const [data, setData] = useState<BorrowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("riskLevel");
  const [asc, setAsc] = useState(true);
  const [selected, setSelected] = useState<Borrower | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/borrowers");
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

  const toggleSort = (key: SortKey) => {
    if (sort === key) setAsc((a) => !a);
    else { setSort(key); setAsc(true); }
  };

  const filtered = (data?.borrowers ?? [])
    .filter((b) => {
      const q = search.toLowerCase();
      return (
        b.company.toLowerCase().includes(q) ||
        b.firstName.toLowerCase().includes(q) ||
        b.lastName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let diff = 0;
      if (sort === "company") diff = a.company.localeCompare(b.company);
      else if (sort === "creditScore") diff = a.creditScore - b.creditScore;
      else if (sort === "totalOutstanding") diff = a.totalOutstanding - b.totalOutstanding;
      else if (sort === "riskLevel") diff = (RISK_ORDER[a.riskLevel] ?? 4) - (RISK_ORDER[b.riskLevel] ?? 4);
      return asc ? diff : -diff;
    });

  const SortIcon = ({ k }: { k: SortKey }) =>
    sort === k ? (asc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />) : null;

  const creditScoreColor = (score: number) =>
    score >= 720 ? "text-emerald-400" : score >= 660 ? "text-blue-400" : score >= 580 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrowers"
        description="Full borrower registry — synced live every 10 seconds"
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
            <Users className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Total Borrowers</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{loading ? "—" : data?.total}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-xs text-muted-foreground">High/Critical Risk</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{loading ? "—" : data?.highRisk}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-muted-foreground">Total Exposure</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{loading ? "—" : formatCurrency(data?.totalExposure ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-muted-foreground">Low Risk</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {loading ? "—" : (data?.borrowers ?? []).filter((b) => b.riskLevel === "low").length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle>All Borrowers</CardTitle>
                <CardDescription>Click a row to view details</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-muted/30 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-48"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    {([ ["Company", "company"], ["Credit Score", "creditScore"], ["Outstanding", "totalOutstanding"], ["Risk", "riskLevel"] ] as [string, SortKey][]).map(([label, key]) => (
                      <th
                        key={key}
                        onClick={() => toggleSort(key)}
                        className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
                      >
                        {label}<SortIcon k={key} />
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Loans</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelected(b)}
                      className={`border-b border-border/30 cursor-pointer transition-colors ${selected?.id === b.id ? "bg-primary/5" : "hover:bg-muted/20"}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground text-xs leading-tight">{b.company}</p>
                        <p className="text-[10px] text-muted-foreground">{b.firstName} {b.lastName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${creditScoreColor(b.creditScore)}`}>{b.creditScore}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground text-xs">{formatCurrency(b.totalOutstanding)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.riskLevel} type="risk" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{b.totalLoans}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No borrowers match your search.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Borrower Detail
            </CardTitle>
            <CardDescription>Select a row to inspect</CardDescription>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-bold text-foreground">{selected.company}</p>
                  <p className="text-sm text-muted-foreground">{selected.firstName} {selected.lastName}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {selected.city}, {selected.state}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5 shrink-0" />
                    {selected.email}
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">{selected.phone}</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-muted/10 p-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Credit Score</p>
                    <p className={`text-xl font-bold mt-1 ${creditScoreColor(selected.creditScore)}`}>{selected.creditScore}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Level</p>
                    <div className="mt-1"><StatusBadge status={selected.riskLevel} type="risk" /></div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Outstanding</p>
                    <p className="text-sm font-bold text-foreground mt-1">{formatCurrency(selected.totalOutstanding)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Loans</p>
                    <p className="text-sm font-bold text-foreground mt-1">{selected.totalLoans}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Credit Score Gauge</p>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${((selected.creditScore - 300) / 550) * 100}%`,
                        background: selected.creditScore >= 720 ? "#10b981" : selected.creditScore >= 660 ? "#3b82f6" : selected.creditScore >= 580 ? "#f59e0b" : "#f43f5e",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>300</span><span>850</span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Onboarded {new Date(selected.onboardedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a borrower to view details.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
