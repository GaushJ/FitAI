import { BrandLogo } from "@/components/molecules/BrandLogo";
import { FOOTER_COLUMNS } from "@/features/landing/content";

export function LandingFooter() {
  return (
    <footer className="border-t border-line bg-surface-container">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-8 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <BrandLogo />
          <p className="mt-3 max-w-sm text-sm text-ink-muted">
            Direct, fast macro tracking via text, voice and label photos — logging your daily food without database
            scrolling.
          </p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">{"// "}{column.title}</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-ink-muted transition hover:text-ink">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 font-mono text-[11px] uppercase tracking-widest text-ink-muted sm:flex-row sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} GetFitBro. Simple &amp; accurate nutrition tracking.</span>
          <span>
            Voice · Text · <span className="text-primary">Nutrition labels</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
