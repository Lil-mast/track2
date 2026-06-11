"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { borrowers, formatCurrency, riskColorClass, type RiskLevel } from "@/lib/data";

const riskFilters: { value: RiskLevel | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High Risk" },
  { value: "medium", label: "Medium Risk" },
  { value: "low", label: "Low Risk" },
];

export function BorrowersTable() {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<RiskLevel | "all">("all");

  const filtered = useMemo(() => {
    return borrowers.filter((b) => {
      const matchesRisk = risk === "all" || b.riskLevel === risk;
      const q = query.toLowerCase();
      const matchesQuery =
        q === "" ||
        b.name.toLowerCase().includes(q) ||
        b.company.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q);
      return matchesRisk && matchesQuery;
    });
  }, [query, risk]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search borrowers..."
            aria-label="Search borrowers"
            className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by risk level">
          {riskFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setRisk(filter.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                risk === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={risk === filter.value}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th scope="col" className="px-5 py-3 font-medium">Borrower</th>
              <th scope="col" className="px-5 py-3 font-medium">Loan</th>
              <th scope="col" className="px-5 py-3 font-medium">Outstanding</th>
              <th scope="col" className="px-5 py-3 font-medium">Term</th>
              <th scope="col" className="px-5 py-3 font-medium">Missed</th>
              <th scope="col" className="px-5 py-3 font-medium">Risk</th>
              <th scope="col" className="px-5 py-3 font-medium">Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/dashboard/borrowers/${b.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {b.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{b.company}</p>
                </td>
                <td className="px-5 py-3.5 tabular-nums">{formatCurrency(b.loanAmount)}</td>
                <td className="px-5 py-3.5 tabular-nums">{formatCurrency(b.outstanding)}</td>
                <td className="px-5 py-3.5 tabular-nums">{b.termProgress}%</td>
                <td className="px-5 py-3.5 tabular-nums">{b.missedPayments}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${riskColorClass(b.riskLevel)}`}
                  >
                    {b.riskScore}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">{b.recommendedAction}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No borrowers match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
