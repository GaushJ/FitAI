import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "dark" | "primary" | "muted" | "success" | "warning";

const TONES: Record<Tone, string> = {
  dark: "bg-ink text-white",
  primary: "bg-primary text-white",
  muted: "bg-surface-container text-ink-muted",
  success: "border border-success/40 bg-success-soft text-success",
  warning: "border border-warning/40 bg-warning-soft text-warning",
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

/** Small uppercase mono tag, e.g. "10 SAVED" or "SET". */
export function Badge({ tone = "dark", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
