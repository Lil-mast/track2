"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { mockLenders } from "@/data/mock/lenders";
import { DEFAULT_LENDER_ID } from "@/lib/constants";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const lender = mockLenders.find((item) => item.id === DEFAULT_LENDER_ID);

  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar lenderName={lender?.name} />
      <div className="lg:pl-64">
        <AppHeader />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
