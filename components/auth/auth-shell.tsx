import Link from "next/link";
import { Sparkles } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />

      <Link href="/" className="relative mb-8 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-4.5" aria-hidden="true" />
        </span>
        <span className="text-lg font-semibold tracking-tight">RecoveryAI</span>
      </Link>

      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 md:p-8">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>

      <div className="relative mt-6 text-sm text-muted-foreground">{footer}</div>

      <p className="relative mt-8 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
        Secured by AWS Cognito with built-in email verification.
      </p>
    </main>
  );
}
