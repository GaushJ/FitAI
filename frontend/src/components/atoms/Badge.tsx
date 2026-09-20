import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "accent" | "heat" | "success" | "warning";

const TONES: Record<Tone, string> = {
  accent: "bg-accent text-ink",
  heat: "bg-heat text-ink",
  success: "text-emerald-400 bg-emerald-950/40 border border-emerald-500/20",
  warning: "text-amber-400 bg-amber-950/40 border border-amber-500/20",
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "accent", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
