import { DatabaseWarmupGate } from "@/components/shared/database-warmup-gate";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DatabaseWarmupGate>
      <DashboardShell>{children}</DashboardShell>
    </DatabaseWarmupGate>
  );
}
