import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  /** "lg" is a full panel placeholder, "sm" a compact hint. */
  size?: "sm" | "lg";
  /** Dashed outline; turn off for a bare centred message. */
  bordered?: boolean;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({ icon, title, size = "lg", bordered = true, className, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        size === "lg" ? "py-14" : "py-7",
        bordered && "border border-dashed border-line-strong bg-surface-low",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex size-11 items-center justify-center border border-line bg-card text-ink-subtle [&>svg]:size-5">
          {icon}
        </div>
      )}
      {title && <h4 className="font-display text-base font-semibold uppercase tracking-wide text-ink">{title}</h4>}
      {children && <p className={cn("max-w-sm text-sm text-ink-muted", title && "mt-1")}>{children}</p>}
    </div>
  );
}
