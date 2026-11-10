import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClasses } from "@/components/atoms/Button";
import { BrandLogo } from "@/components/molecules/BrandLogo";
import { NAV_LINKS, PRO_PRICE } from "@/features/landing/content";

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/" aria-label="GetFitBro home">
          <BrandLogo />
        </Link>

        <div className="hidden items-center gap-6 font-display text-sm uppercase tracking-wide lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="text-ink-muted transition hover:text-ink">
              {link.label}
            </a>
          ))}
          <a href="#pricing" className="flex items-center gap-1.5 text-ink-muted transition hover:text-ink">
            Pro <span className="bg-primary-soft px-1.5 font-mono text-xs text-primary">{PRO_PRICE}</span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden px-2 font-display text-sm uppercase tracking-wide text-ink-muted hover:text-ink sm:block">
            Sign in
          </Link>
          <Link href="/login" className={buttonClasses({ variant: "dark", size: "sm" })}>
            Log a meal <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
