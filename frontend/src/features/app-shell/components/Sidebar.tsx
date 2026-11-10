"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, LogOut, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/molecules/BrandLogo";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/nutrition";
import { useLogout } from "@/features/auth/hooks/useAuthSession";
import { useProfile } from "@/features/profile/ProfileProvider";
import { NAV_ITEMS } from "@/features/app-shell/navItems";

function UserCard() {
  const { profile } = useProfile();
  const name = profile?.name || profile?.username || "";

  return (
    <div className="flex items-center gap-3 border-y border-line px-5 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center bg-ink font-display text-lg font-bold text-white">
        {name.charAt(0).toUpperCase() || "·"}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{name || "Loading…"}</p>
        <p className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wide text-primary">
          <Flame className="size-3" />
          {pluralize(profile?.current_streak ?? 0, "day")} streak
        </p>
      </div>
      {profile?.is_pro && (
        <span className="ml-auto flex items-center gap-1 bg-primary px-1.5 py-0.5 font-mono text-[10px] text-white">
          <Sparkles className="size-3" /> PRO
        </span>
      )}
    </div>
  );
}

/** Left navigation: brand, signed-in user, page links and sign-out. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <div className="flex h-full flex-col bg-surface">
      <Link href="/dashboard" onClick={onNavigate} className="block px-5 pt-6 pb-5">
        <BrandLogo />
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted">{"// "}Calorie &amp; macro tracker</p>
      </Link>

      <UserCard />

      <nav aria-label="Main" className="flex-1 px-3 py-5">
        <p className="mb-2 px-3 font-mono text-[11px] uppercase tracking-widest text-ink-subtle">{"// "}Navigation</p>
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 border-l-4 px-3 py-2.5 font-display text-base uppercase tracking-wide transition",
                    active
                      ? "border-primary bg-surface-container font-semibold text-ink"
                      : "border-transparent text-ink-muted hover:bg-surface-low hover:text-ink",
                  )}
                >
                  <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 font-display text-base uppercase tracking-wide text-ink-muted transition hover:bg-danger-soft hover:text-danger"
        >
          <LogOut className="size-[18px]" />
          Sign out
        </button>
      </div>
    </div>
  );
}
