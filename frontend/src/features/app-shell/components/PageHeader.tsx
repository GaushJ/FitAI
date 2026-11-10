import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Mono kicker above the title, e.g. "Today's macro dashboard". */
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned buttons. */
  actions?: ReactNode;
}

/** Top-of-page title block shared by every app screen. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">{"// "}{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-none tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        {description && <p className="mt-3 max-w-2xl text-base text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
