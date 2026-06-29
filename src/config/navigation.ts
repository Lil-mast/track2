import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  ScrollText,
  Sparkles,
  Database,
  Bot,
} from "lucide-react";

export const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Borrowers",
    href: "/borrowers",
    icon: Users,
  },
  {
    title: "Loans",
    href: "/loans",
    icon: FileText,
  },
  {
    title: "Recovery",
    href: "/recovery",
    icon: Sparkles,
  },
  {
    title: "Data Ingestion",
    href: "/ingestion",
    icon: Database,
  },
  {
    title: "Agentic AI",
    href: "/ai-agent",
    icon: Bot,
  },
  {
    title: "Rules",
    href: "/rules",
    icon: Shield,
  },
  {
    title: "Audit Logs",
    href: "/audit-logs",
    icon: ScrollText,
  },
] as const;
