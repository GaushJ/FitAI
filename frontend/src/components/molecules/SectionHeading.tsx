import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  /** Short code shown in a dark box before the title, e.g. "02". */
  index?: string;
  /** Leading icon, e.g. <Tag />. */
  icon?: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned slot (buttons, counters). */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Panel title in the design's "[ 02 ] LOG A MEAL" style. */
export function SectionHeading({ index, icon, subtitle, action, className, children }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {index && (
          <span className="shrink-0 bg-ink px-2 py-0.5 font-mono text-sm font-medium text-white">[ {index} ]</span>
        )}
        {icon && <span className="mt-0.5 shrink-0 text-primary [&>svg]:size-5">{icon}</span>}
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold uppercase leading-tight tracking-tight text-ink">
            {children}
          </h2>
          {subtitle && <p className="mt-0.5 font-mono text-xs text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
