"use client";

import { useState, type ReactNode } from "react";
import { BarChart2, BookMarked, Dumbbell, Flame, KeyRound, LogOut, Menu, Settings, X } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { cn } from "@/lib/cn";

type NavTone = "default" | "muted" | "danger";

const NAV_TONES: Record<NavTone, string> = {
  default: "text-slate-300 hover:text-slate-100 hover:bg-slate-800",
  muted: "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
  danger: "text-slate-500 hover:text-red-400 hover:bg-red-900/40 hover:border-red-900",
};

interface NavItem {
  id: string;
  label: string;
  /** Tooltip / accessible name when the label is hidden. */
  title: string;
  icon: ReactNode;
  badge?: ReactNode;
  tone?: NavTone;
  /** Desktop shows just the icon (mobile always shows the label). */
  iconOnlyOnDesktop?: boolean;
  onSelect: () => void;
}

function NavButton({ item, stacked, onDone }: { item: NavItem; stacked?: boolean; onDone?: () => void }) {
  const iconOnly = item.iconOnlyOnDesktop && !stacked;
  return (
    <button
      type="button"
      title={item.title}
      aria-label={item.title}
      onClick={() => {
        item.onSelect();
        onDone?.();
      }}
      className={cn(
        "flex shrink-0 cursor-pointer items-center rounded-xl border border-slate-800 bg-slate-900/80 font-semibold transition [&>svg]:size-4",
        NAV_TONES[item.tone ?? "default"],
        stacked ? "gap-2 px-4 py-2.5 text-sm" : iconOnly ? "size-10 justify-center" : "gap-1.5 px-3 py-2 text-xs",
      )}
    >
      {item.icon}
      {!iconOnly && <span>{item.label}</span>}
      {!iconOnly && item.badge}
    </button>
  );
}

function StreakBadge({ days, stacked }: { days: number; stacked?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border border-slate-800/80 bg-slate-900/80 px-4 text-xs font-semibold",
        stacked ? "rounded-xl py-2" : "shrink-0 rounded-full py-1.5",
      )}
    >
      <Flame className="h-4 w-4 animate-pulse text-orange-500" />
      <span className="text-slate-300">Streak:</span>
      <span className="text-sm font-bold text-orange-400">{days} days</span>
    </div>
  );
}

interface DashboardHeaderProps {
  streakDays: number;
  username: string;
  missingKeyCount: number;
  brandCount: number;
  onOpenApiKeys: () => void;
  onOpenBrands: () => void;
  onOpenProgress: () => void;
  onOpenTargets: () => void;
  onLogout: () => void;
}

export function DashboardHeader({
  streakDays,
  username,
  missingKeyCount,
  brandCount,
  onOpenApiKeys,
  onOpenBrands,
  onOpenProgress,
  onOpenTargets,
  onLogout,
}: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const items: NavItem[] = [
    {
      id: "api-keys",
      label: "API Keys",
      title: "Manage API Keys",
      icon: <KeyRound className="text-amber-400" />,
      badge: missingKeyCount > 0 && <Badge tone="heat">{missingKeyCount} missing</Badge>,
      onSelect: onOpenApiKeys,
    },
    {
      id: "brands",
      label: "Brands",
      title: "Brand Preferences",
      icon: <BookMarked className="text-accent" />,
      badge: brandCount > 0 && <Badge>{brandCount}</Badge>,
      onSelect: onOpenBrands,
    },
    {
      id: "progress",
      label: "Progress",
      title: "View Progress",
      icon: <BarChart2 className="text-accent" />,
      onSelect: onOpenProgress,
    },
    {
      id: "targets",
      label: "Configure Targets",
      title: "Configure Targets",
      icon: <Settings />,
      tone: "muted",
      iconOnlyOnDesktop: true,
      onSelect: onOpenTargets,
    },
    {
      id: "logout",
      label: `Sign out (${username})`,
      title: `Sign out (${username})`,
      icon: <LogOut />,
      tone: "danger",
      iconOnlyOnDesktop: true,
      onSelect: onLogout,
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-900 bg-slate-950/80 px-4 py-4 backdrop-blur-md sm:px-6 md:px-12">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Dumbbell className="h-7 w-7 shrink-0 text-accent" strokeWidth={1.8} />
          <div>
            <h1 className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-accent">
              GetFitbro
              <span className="rounded-full border border-accent/30 bg-accent/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest">
                Active AI
              </span>
            </h1>
            <p className="text-[10px] text-slate-500">AI-Powered Macro Tracking</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 sm:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav className="hidden items-center gap-2 sm:flex sm:gap-3">
          <StreakBadge days={streakDays} />
          {items.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </nav>
      </div>

      {menuOpen && (
        <nav className="mt-3 flex flex-col gap-2 sm:hidden">
          <StreakBadge days={streakDays} stacked />
          {items.map((item) => (
            <NavButton key={item.id} item={item} stacked onDone={() => setMenuOpen(false)} />
          ))}
        </nav>
      )}
    </header>
  );
}
