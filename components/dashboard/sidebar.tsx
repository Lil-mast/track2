"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Lightbulb,
  Settings,
  Sparkles,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/borrowers", label: "Borrowers", icon: Users },
  { href: "/dashboard/insights", label: "AI Insights", icon: Lightbulb },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Dashboard navigation">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive(item.href)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          <item.icon className="size-4.5" aria-hidden="true" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight">RecoveryAI</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex size-9 items-center justify-center rounded-md text-foreground"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-b border-border bg-card px-4 py-4 lg:hidden">{nav}</div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight">RecoveryAI</span>
        </Link>
        {nav}
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex items-center gap-3 px-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
              AL
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Acme Lending</span>
              <span className="text-xs text-muted-foreground">Growth plan</span>
            </div>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Link>
        </div>
      </aside>
    </>
  );
}
