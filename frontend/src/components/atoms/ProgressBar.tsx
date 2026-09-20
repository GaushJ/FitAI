import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** 0–150; values over 100 overflow (clipped) to signal going over target. */
  percent: number;
  /** "lg" is the framed calorie bar, "sm" the slim macro bar. */
  size?: "sm" | "lg";
  fillClassName: string;
  label?: string;
}

export function ProgressBar({ percent, size = "sm", fillClassName, label }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-slate-950",
        size === "lg" ? "h-3 border border-slate-850 p-[2px]" : "h-2",
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700", fillClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
