/**
 * Dashboard layout — minimal version to support the demo page.
 *
 * DEMO NOTE: This is intentionally bare — no sidebar, no header.
 * The real dashboard layout lives in frontend/src/app/(dashboard)/layout.tsx
 * and should be migrated here following MIGRATION.md Step 1.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
