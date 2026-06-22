import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  ScrollText,
  Sparkles,
} from "lucide-react";

export const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
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
