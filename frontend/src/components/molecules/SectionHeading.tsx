import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const HEADING_SIZES = { sm: "text-sm", md: "text-base", lg: "text-lg" } as const;

interface SectionHeadingProps {
  /** Pass a coloured icon element, e.g. <Utensils className="text-accent" />. */
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  subtitle?: ReactNode;
  /** Right-aligned slot (buttons, counters). */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function SectionHeading({
  icon,
  size = "lg",
  subtitle,
  action,
  className,
  children,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h2
          className={cn(
            "flex items-center gap-2 font-bold text-slate-100 [&>svg]:size-4",
            HEADING_SIZES[size],
          )}
        >
          {icon}
          {children}
        </h2>
        {subtitle && (
          <p className={cn("mt-0.5 text-slate-500", size === "lg" ? "text-xs" : "text-[10px]")}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
