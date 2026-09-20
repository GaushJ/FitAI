import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Padding = "md" | "lg" | "xl";

const PADDING: Record<Padding, string> = {
  md: "p-5",
  lg: "p-6",
  xl: "p-6 md:p-8",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
}

/** Frosted-glass surface used for every dashboard / progress panel. */
export function Card({ padding = "lg", className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-800/80 bg-slate-900/40 shadow-2xl backdrop-blur-md",
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  );
}
