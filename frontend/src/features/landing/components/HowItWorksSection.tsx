import { HOW_IT_WORKS_STEPS } from "@/features/landing/content";
import { Panel } from "@/features/landing/components/Panel";
import { Reveal } from "@/features/landing/components/Reveal";
import { SectionIntro } from "@/features/landing/components/SectionIntro";

export function HowItWorksSection() {
  return (
    <section id="how" className="mx-auto max-w-[1240px] px-8 py-[110px] max-[640px]:px-5 max-[640px]:py-16">
      <Reveal className="mb-[72px] text-center">
        <SectionIntro eyebrow="Three steps" titleClassName="text-[clamp(32px,4vw,54px)] leading-[1.02]">
          From spoken to logged
          <br />
          in under five seconds.
        </SectionIntro>
      </Reveal>

      <div className="grid grid-cols-3 gap-[22px] max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <Reveal key={step.number} delay={index * 0.1}>
            <Panel className="relative h-full rounded-[22px] px-7 py-8">
              <span className="absolute top-[26px] right-7 font-display text-[40px] leading-none font-extrabold text-accent/[0.13]">
                {step.number}
              </span>
              <div className="mb-[22px] flex size-[52px] items-center justify-center rounded-[15px] border border-accent/[0.28] bg-accent/[0.12]">
                <svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent"
                  aria-hidden
                >
                  <path d={step.iconPath} />
                </svg>
              </div>
              <h3 className="mb-2.5 font-display text-[22px] font-bold tracking-[-0.01em]">{step.title}</h3>
              <p className="text-[15px] leading-[1.55] text-slate-400">{step.description}</p>
            </Panel>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
