import type { ReactNode } from "react";
import { HEAT_COLORS, STREAK_STATS } from "@/features/landing/content";
import { buildHeatLevels } from "@/features/landing/heatLevels";
import { Panel } from "@/features/landing/components/Panel";
import { Reveal } from "@/features/landing/components/Reveal";
import { SectionIntro } from "@/features/landing/components/SectionIntro";

const HEAT_LEVELS = buildHeatLevels();

function FlameIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2c1 3-1 5-1 7a3 3 0 0 0 6 0c0-1 0-2-1-3 2 1 4 4 4 8a8 8 0 0 1-16 0c0-4 4-7 5-9 1 2 2 2 3-3Z" />
    </svg>
  );
}

function HeatmapPreview() {
  return (
    <Panel className="rounded-3xl p-7">
      <div className="mb-[22px] flex items-center justify-between">
        <div>
          <p className="text-[15px] font-bold">90-day overview</p>
          <p className="text-[13px] text-slate-500">Every day you hit your goal</p>
        </div>
        <div className="flex items-center gap-[7px] rounded-full border border-heat/[0.28] bg-heat/[0.12] px-[13px] py-1.5 text-heat">
          <FlameIcon />
          <span className="text-[13px] font-bold">12-day streak</span>
        </div>
      </div>

      <div className="mb-[18px] grid grid-flow-col grid-rows-7 gap-[5px]">
        {HEAT_LEVELS.map((level, i) => (
          <div
            key={i}
            className="aspect-square w-full rounded-[3px]"
            style={{ background: HEAT_COLORS[level] }}
          />
        ))}
      </div>

      <div className="mb-5 flex items-center justify-end gap-[7px] text-[11px] text-slate-600">
        Less
        {HEAT_COLORS.map((color) => (
          <span key={color} className="size-3 rounded-[3px]" style={{ background: color }} />
        ))}
        More
      </div>

      <div className="grid grid-cols-3 gap-3">
        {STREAK_STATS.map((stat) => (
          <div key={stat.label} className="rounded-[13px] bg-white/[0.03] p-3.5 text-center">
            <p className={`font-display text-[26px] font-bold ${stat.valueClassName}`}>{stat.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function StatBadge({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-5 py-4">
      <p className="font-display text-[30px] font-bold">{children}</p>
      <p className="text-[13px] text-slate-500">{label}</p>
    </div>
  );
}

export function StreakSection() {
  return (
    <section className="mx-auto grid max-w-[1240px] grid-cols-2 items-center gap-16 px-8 py-[110px] max-[900px]:grid-cols-1 max-[900px]:gap-10 max-[640px]:px-5 max-[640px]:py-16">
      <Reveal>
        <HeatmapPreview />
      </Reveal>

      <Reveal delay={0.12}>
        <SectionIntro eyebrow="Streaks" titleClassName="mb-[22px] text-[clamp(28px,3.5vw,48px)] leading-[1.04]">
          Consistency you
          <br />
          can actually see.
        </SectionIntro>
        <p className="mb-[30px] max-w-[440px] text-[17px] leading-[1.6] text-slate-400">
          A GitHub-style heatmap turns every logged day into a square. Watch the grid fill, keep the streak
          alive, and let the satisfying chain of green do the motivating for you.
        </p>
        <div className="flex flex-wrap gap-3.5">
          <StatBadge label="Avg streak length">
            <span className="text-accent">23</span>
          </StatBadge>
          <StatBadge label="Stick past week one">
            71<span className="text-lg text-slate-500">%</span>
          </StatBadge>
        </div>
      </Reveal>
    </section>
  );
}
