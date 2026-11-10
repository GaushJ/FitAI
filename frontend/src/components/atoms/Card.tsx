import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Padding = "none" | "md" | "lg";
type Tone = "plain" | "raised" | "muted";

const PADDING: Record<Padding, string> = {
  none: "",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-7",
};

const TONES: Record<Tone, string> = {
  plain: "border border-line bg-card",
  /** Hard ink shadow — the design's "primary panel" treatment. */
  raised: "border border-ink bg-card shadow-hard",
  muted: "border border-line bg-surface-low",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  tone?: Tone;
}

/** Square-cornered panel used for every app section. */
export function Card({ padding = "lg", tone = "plain", className, ...rest }: CardProps) {
  return <div className={cn(TONES[tone], PADDING[padding], className)} {...rest} />;
}
