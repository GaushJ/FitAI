import { BarChart3, KeyRound, LayoutDashboard, Settings, Tags, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/brand-preferences", label: "Brand Preferences", icon: Tags },
  { href: "/progress", label: "Progress & Logs", icon: BarChart3 },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/settings", label: "Settings & Targets", icon: Settings },
];
