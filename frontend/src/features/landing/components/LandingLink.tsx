import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

const VARIANTS = {
  primary:
    "bg-accent px-[26px] py-[15px] text-base font-bold text-ink hover:scale-[1.02] hover:bg-[#d6fb5f] transition-[background-color,transform] duration-150",
  ghost:
    "border border-white/[0.16] px-[22px] py-[15px] text-base font-semibold text-slate-100 hover:border-accent/50 transition-colors duration-150",
} as const;

interface LandingLinkProps {
  href: string;
  variant: keyof typeof VARIANTS;
  children: ReactNode;
  className?: string;
}

/** Large call-to-action link. Anchors (`#how`) render as plain <a> to keep smooth in-page scrolling. */
export function LandingLink({ href, variant, children, className }: LandingLinkProps) {
  const classes = cn("inline-flex items-center gap-[9px] rounded-[14px]", VARIANTS[variant], className);
  return href.startsWith("#") ? (
    <a href={href} className={classes}>
      {children}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
