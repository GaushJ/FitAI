import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { wrapper: string; icon: string; strokeWidth: number; text: string }> = {
  sm: { wrapper: "gap-[9px]", icon: "size-[18px]", strokeWidth: 2, text: "text-[15px]" },
  md: { wrapper: "gap-2.5", icon: "size-[22px]", strokeWidth: 1.8, text: "text-lg" },
  lg: { wrapper: "gap-2.5", icon: "size-[26px]", strokeWidth: 1.8, text: "text-[22px]" },
};

interface BrandLogoProps {
  size?: Size;
  className?: string;
  /** Extra classes for the wordmark, e.g. responsive font sizes. */
  textClassName?: string;
}

/** Dumbbell mark + "GetFitbro" wordmark. */
export function BrandLogo({ size = "md", className, textClassName }: BrandLogoProps) {
  const styles = SIZES[size];
  return (
    <span className={cn("flex items-center", styles.wrapper, className)}>
      <Dumbbell className={cn("shrink-0 text-accent", styles.icon)} strokeWidth={styles.strokeWidth} />
      <span className={cn("font-display font-bold tracking-[-0.02em]", styles.text, textClassName)}>GetFitbro</span>
    </span>
  );
}
