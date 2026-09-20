import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Dark gradient card with a hairline border — the landing page's main surface. */
export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border border-white/[0.09] bg-[linear-gradient(160deg,#17190F,#0C0D08)]", className)}
      {...rest}
    />
  );
}
