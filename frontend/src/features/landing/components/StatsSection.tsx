"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/cn";
import { COUNTER_STATS } from "@/features/landing/content";
import { Reveal } from "@/features/landing/components/Reveal";
import { SectionIntro } from "@/features/landing/components/SectionIntro";

interface CounterCardProps {
  target: number;
  suffix: string;
  label: string;
  highlight: boolean;
  active: boolean;
}

function CounterCard({ target, suffix, label, highlight, active }: CounterCardProps) {
  const value = useCountUp(target, active);
  return (
    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-[26px] py-[30px]">
      <p
        className={cn(
          "font-display text-[46px] font-extrabold tracking-[-0.02em]",
          highlight ? "text-accent" : "text-slate-100",
        )}
      >
        {value.toLocaleString("en-US")}
        {suffix}
      </p>
      <p className="mt-1.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}

/** Headline numbers that count up when the section first scrolls into view. */
export function StatsSection() {
  const { ref, inView } = useInView<HTMLElement>(0.3);

  return (
    <section ref={ref} className="mx-auto max-w-[1240px] px-8 py-[110px] max-[640px]:px-5 max-[640px]:py-16">
      <Reveal className="mb-[60px] text-center">
        <SectionIntro eyebrow="By the numbers" titleClassName="text-[clamp(28px,4vw,54px)] leading-[1.02]">
          Precision that adds up.
        </SectionIntro>
      </Reveal>

      <div className="grid grid-cols-4 gap-5 max-[760px]:grid-cols-2 max-[420px]:grid-cols-1">
        {COUNTER_STATS.map((stat) => (
          <CounterCard key={stat.label} {...stat} active={inView} />
        ))}
      </div>
    </section>
  );
}
