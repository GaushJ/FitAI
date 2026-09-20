import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface AuthTab<T extends string> {
  id: T;
  label: string;
  icon: ReactNode;
}

interface AuthTabBarProps<T extends string> {
  tabs: AuthTab<T>[];
  value: T;
  onChange: (id: T) => void;
}

/** Underline-style tab bar that tops the auth card. */
export function AuthTabBar<T extends string>({ tabs, value, onChange }: AuthTabBarProps<T>) {
  return (
    <div role="tablist" className="flex border-b border-white/[0.07]">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-[7px] border-b-2 py-4 text-[13px] font-bold transition-colors",
              active ? "border-accent text-accent" : "border-transparent text-slate-500",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
