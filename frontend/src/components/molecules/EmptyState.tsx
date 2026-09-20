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

export function EmptyState({
  icon,
  title,
  size = "lg",
  bordered = true,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        size === "lg" ? "py-16" : "py-8",
        bordered && "rounded-2xl border border-dashed border-slate-900",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-900 bg-slate-950 text-slate-600 [&>svg]:size-5">
          {icon}
        </div>
      )}
      {title && <h4 className="text-sm font-bold text-slate-300">{title}</h4>}
      {children && (
        <p className={cn("max-w-[280px] text-xs text-slate-500", title && "mt-1 max-w-[240px]")}>{children}</p>
      )}
    </div>
  );
}
