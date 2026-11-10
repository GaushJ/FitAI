import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { mark: string; icon: string; text: string }> = {
  sm: { mark: "size-6", icon: "size-3.5", text: "text-lg" },
  md: { mark: "size-7", icon: "size-4", text: "text-2xl" },
  lg: { mark: "size-11", icon: "size-6", text: "text-4xl" },
};

interface BrandLogoProps {
  size?: Size;
  className?: string;
}

/** Red dumbbell mark + "GETFITBRO" wordmark. */
export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  const styles = SIZES[size];
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className={cn("flex shrink-0 items-center justify-center bg-primary text-white shadow-hard-sm", styles.mark)}>
        <Dumbbell className={cn("-rotate-45", styles.icon)} strokeWidth={2.4} />
      </span>
      <span className={cn("font-display font-bold uppercase leading-none tracking-tight text-ink", styles.text)}>
        GetFitBro
      </span>
    </span>
  );
}
