import { Database, KeyRound, Bot, Bell } from "lucide-react";

export const metadata = {
  title: "Settings — RecoveryAI",
};

const sections = [
  {
    icon: Database,
    title: "Database",
    description: "Amazon Aurora PostgreSQL connection for loan and borrower records.",
    status: "Pending setup",
    detail: "AURORA_DATABASE_URL",
  },
  {
    icon: KeyRound,
    title: "Authentication",
    description: "AWS Cognito user pool for team sign-in and email verification.",
    status: "Pending setup",
    detail: "COGNITO_USER_POOL_ID",
  },
  {
    icon: Bot,
    title: "AI Engine",
    description: "AWS Bedrock model used to generate recovery recommendations.",
    status: "Pending setup",
    detail: "BEDROCK_MODEL_ID",
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Workspace configuration and platform integrations.
        </p>
      </header>

      {/* Workspace */}
      <section aria-label="Workspace" className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Workspace</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="org-name" className="text-sm font-medium">
              Organization name
            </label>
            <input
              id="org-name"
              type="text"
              defaultValue="Acme Lending"
              className="rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="currency" className="text-sm font-medium">
              Reporting currency
            </label>
            <select
              id="currency"
              defaultValue="USD"
              className="rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="KES">KES — Kenyan Shilling</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <button
            type="button"
            className="w-fit rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </section>

      {/* Integrations */}
      <section aria-label="Integrations" className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Platform Integrations</h2>
        {sections.map((section) => (
          <div
            key={section.title}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <section.icon className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{section.title}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {section.description}
              </span>
              <span className="mt-1 font-mono text-xs text-muted-foreground">
                {section.detail}
              </span>
            </div>
            <span className="ml-auto shrink-0 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
              {section.status}
            </span>
          </div>
        ))}
      </section>

      {/* Notifications */}
      <section aria-label="Notifications" className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Notifications</h2>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {[
            "Email me when a new high-risk account is detected",
            "Email me a weekly recovery performance summary",
            "Notify me when AI recommendations are pending review",
          ].map((label) => (
            <label key={label} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                defaultChecked
                className="size-4 rounded border-input accent-[oklch(0.78_0.16_160)]"
              />
              {label}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
