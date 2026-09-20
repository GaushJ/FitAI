import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "caps" | "plain" | "micro";

const VARIANTS: Record<Variant, { label: string; defaultTone: string }> = {
  caps: { label: "block mb-1.5 text-[10px] font-bold uppercase tracking-wider", defaultTone: "text-slate-500" },
  plain: { label: "block mb-1.5 text-xs font-semibold", defaultTone: "text-slate-300" },
  micro: { label: "block text-[8px] font-bold uppercase", defaultTone: "text-slate-500" },
};

interface FormFieldProps {
  label: ReactNode;
  variant?: Variant;
  /** Overrides the label colour, e.g. to colour-code a macro. */
  labelClassName?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Wraps a control in a <label> so clicking the caption focuses it. */
export function FormField({
  label,
  variant = "caps",
  labelClassName,
  hint,
  className,
  children,
}: FormFieldProps) {
  const styles = VARIANTS[variant];
  return (
    <label className={cn("block", className)}>
      <span className={cn(styles.label, labelClassName ?? styles.defaultTone)}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-slate-500">{hint}</span>}
    </label>
  );
}
