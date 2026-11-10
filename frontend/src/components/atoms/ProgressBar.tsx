import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** 0–150; values over 100 are clipped to a full bar. */
  percent: number;
  fillClassName?: string;
  label?: string;
  className?: string;
}

export function ProgressBar({ percent, fillClassName = "bg-ink", label, className }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden bg-surface-highest", className)}
    >
      <div
        className={cn("h-full transition-all duration-700", fillClassName)}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
