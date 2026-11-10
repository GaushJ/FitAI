import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedTabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Stretch tabs to fill the row (forms) rather than size to content (toolbars). */
  fullWidth?: boolean;
  /** "dark" fills the active tab with ink; "light" lifts it onto a white card. */
  tone?: "dark" | "light";
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  fullWidth = true,
  tone = "dark",
}: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" className={cn("gap-1 border border-line bg-surface-container p-1", fullWidth ? "flex" : "inline-flex")}>
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
              "flex cursor-pointer items-center justify-center gap-2 px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide transition [&>svg]:size-4",
              fullWidth && "flex-1",
              active
                ? tone === "dark"
                  ? "bg-ink text-white"
                  : "border border-line bg-card text-ink"
                : "text-ink-muted hover:text-ink",
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
