import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionIntroProps {
  eyebrow: string;
  children: ReactNode;
  /** Tailwind classes for the title's font size / line height. */
  titleClassName: string;
  className?: string;
}

/** Small uppercase eyebrow over a large display heading. */
export function SectionIntro({ eyebrow, children, titleClassName, className }: SectionIntroProps) {
  return (
    <div className={className}>
      <p className="mb-4 text-[13px] font-bold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>
      <h2 className={cn("font-display font-bold tracking-[-0.03em]", titleClassName)}>{children}</h2>
    </div>
  );
}
