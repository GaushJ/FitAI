import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FormFieldProps {
  label: ReactNode;
  /** Right-aligned note beside the label, e.g. "[ min 3 chars ]". */
  aside?: ReactNode;
  /** Overrides the label colour, e.g. to colour-code a macro. */
  labelClassName?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Wraps a control in a <label> so clicking the caption focuses it. */
export function FormField({ label, aside, labelClassName, hint, className, children }: FormFieldProps) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "font-mono text-[11px] font-medium uppercase tracking-widest",
            labelClassName ?? "text-ink-muted",
          )}
        >
          {label}
        </span>
        {aside && <span className="font-mono text-[11px] uppercase tracking-wider text-ink-subtle">{aside}</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}
