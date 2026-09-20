import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  /** Overrides the default accent highlight for the active tab. */
  activeClassName?: string;
}

interface SegmentedTabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
}

export function SegmentedTabs<T extends string>({ tabs, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" className="flex gap-1 rounded-xl bg-slate-950 p-1">
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
              "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition [&>svg]:size-3.5",
              active
                ? (tab.activeClassName ?? "bg-accent text-ink shadow")
                : "text-slate-400 hover:text-slate-200",
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
