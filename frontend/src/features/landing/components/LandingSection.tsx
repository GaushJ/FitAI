import type { ReactNode } from "react";

interface LandingSectionProps {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
}

/** "// 01  HOW LOGGING WORKS" heading with a rule under it, then the section body. */
export function LandingSection({ id, index, title, children }: LandingSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 py-12 sm:py-16">
      <h2 className="mb-8 flex items-baseline gap-3 border-b-2 border-ink pb-3 font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
        <span className="font-mono text-sm font-medium text-primary">{"// "}{index}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
