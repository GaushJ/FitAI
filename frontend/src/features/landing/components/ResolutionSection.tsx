import { Check, Sparkles } from "lucide-react";
import { ENGINE_POINTS, ENGINE_STEPS } from "@/features/landing/content";
import { Panel } from "@/features/landing/components/Panel";
import { Reveal } from "@/features/landing/components/Reveal";
import { SectionIntro } from "@/features/landing/components/SectionIntro";

function EnginePoints() {
  return (
    <div className="flex flex-col gap-[18px]">
      {ENGINE_POINTS.map((point) => (
        <div key={point.title} className="flex items-start gap-3.5">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-accent">
            <Check size={13} strokeWidth={3} className="text-ink" />
          </div>
          <div>
            <p className="mb-[3px] text-base font-bold">{point.title}</p>
            <p className="text-sm leading-[1.45] text-slate-500">{point.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResolutionSteps() {
  return (
    <Panel className="rounded-3xl p-[30px]">
      <div className="mb-[26px] flex items-center gap-3">
        <div className="flex size-[46px] items-center justify-center rounded-[13px] border border-accent/[0.28] bg-accent/[0.12]">
          <Sparkles size={20} className="text-accent" />
        </div>
        <div>
          <p className="text-[15px] font-bold">AI resolution</p>
          <p className="text-[13px] text-slate-500">Near-zero latency</p>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {ENGINE_STEPS.map((step, i) => (
          <div key={step} className="flex flex-col gap-3.5">
            <div className="flex items-start gap-3">
              <span className="pt-0.5 font-mono text-[11px] text-slate-600">0{i + 1}</span>
              <p className="text-[15px] leading-[1.4] text-slate-300">{step}</p>
            </div>
            {i < ENGINE_STEPS.length - 1 && <div className="h-px bg-white/[0.06]" />}
          </div>
        ))}

        <div className="mt-1.5 flex items-center justify-between rounded-[13px] border border-accent/20 bg-accent/[0.07] p-3.5">
          <span className="text-sm font-semibold text-accent">Macros resolved</span>
          <span className="font-mono text-[13px] text-accent">100%</span>
        </div>
      </div>
    </Panel>
  );
}

export function ResolutionSection() {
  return (
    <section className="border-y border-white/[0.06] bg-[#0E0F0A]">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 items-center gap-16 px-8 py-[110px] max-[900px]:grid-cols-1 max-[900px]:gap-10 max-[640px]:px-5 max-[640px]:py-16">
        <Reveal>
          <SectionIntro
            eyebrow="The resolution engine"
            titleClassName="mb-[22px] text-[clamp(28px,3.5vw,48px)] leading-[1.04]"
          >
            One line in,
            <br />
            exact macros out.
          </SectionIntro>
          <p className="mb-8 max-w-[460px] text-[17px] leading-[1.6] text-slate-400">
            Type a quick description — or speak it — and an AI pipeline resolves brands, portion sizes and
            prep methods into precise macros, filling gaps from the web when it needs to.
          </p>
          <EnginePoints />
        </Reveal>

        <Reveal delay={0.12}>
          <ResolutionSteps />
        </Reveal>
      </div>
    </section>
  );
}
