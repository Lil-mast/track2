"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  ScrollText,
  Database,
  Megaphone,
  Bot,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

const navigationGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Borrowers", href: "/dashboard/borrowers", icon: Users },
      { title: "Loans", href: "/dashboard/loans", icon: FileText },
    ],
  },
  {
    label: "AI Platform",
    items: [
      { title: "Recovery", href: "/dashboard/recovery", icon: Sparkles },
      { title: "Data Ingestion", href: "/dashboard/ingestion", icon: Database },
      { title: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
      { title: "Agentic AI", href: "/dashboard/ai-agent", icon: Bot },
    ],
  },
  {
    label: "Compliance",
    items: [
      { title: "Rules", href: "/dashboard/rules", icon: Shield },
      { title: "Audit Logs", href: "/dashboard/audit-logs", icon: ScrollText },
    ],
  },
] as const;

interface AppSidebarProps {
  lenderName?: string;
}

export function AppSidebar({ lenderName = "Meridian Capital" }: AppSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
        <Image
          src="/images/logo.png"
          alt="RecoveryAI"
          width={120}
          height={32}
          className="h-7 w-auto"
          priority
        />
      </div>
      <div className="px-3 py-2 shrink-0">
        <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3">
          {lenderName}
        </p>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav aria-label="Dashboard navigation" className="flex flex-col gap-4">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 mb-1">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border shrink-0 space-y-3">
        <div className="rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-xs font-semibold text-sidebar-foreground">
              AI Engine
            </p>
          </div>
          <p className="text-xs text-sidebar-foreground/50 pl-3.5">
            Amazon Nova Pro · Active
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Log Out
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-background border border-border shadow-sm text-foreground"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
