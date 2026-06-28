import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { getDataRepository } from "@/services";
import { DEFAULT_LENDER_ID } from "@/lib/constants";

/**
 * Render the dashboard per-request, never at build time.
 *
 * Dashboard pages read from the data repository, which on Vercel resolves to
 * Aurora and authenticates via the Vercel OIDC token. That token only exists
 * at request time, so build-time static prerendering would fail with
 * "x-vercel-oidc-token header is missing". force-dynamic moves all rendering
 * for this segment (layout + every nested page) to request time, where the
 * credentials are available.
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
