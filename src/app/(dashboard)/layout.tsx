import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { getDataRepository } from "@/services";
import { DEFAULT_LENDER_ID } from "@/lib/constants";

/**
 * Render the dashboard per-request so Convex fetchQuery runs at request time.
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const repo = getDataRepository();
  const lender = await repo.getLender(DEFAULT_LENDER_ID);

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
