import type { ReactNode } from "react";
import { Mic } from "lucide-react";
import { RESOLVED_ITEMS } from "@/features/landing/content";

function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mb-2.5 text-[11px] font-bold tracking-[0.08em] text-slate-600 uppercase ${className}`}>
      {children}
    </p>
  );
}

/** Static mock of the meal composer + resolved ingredients shown beside the hero copy. */
export function MealPreviewCard() {
  return (
    <div className="relative animate-fv-up [animation-delay:0.3s]">
      <div className="rounded-[26px] border border-white/[0.09] bg-[linear-gradient(160deg,#16180F,#0E0F0A)] p-7 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]">
        <Eyebrow>Log a meal</Eyebrow>
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.04] py-3 pr-3 pl-[18px]">
          <p className="flex-1 text-[15px] leading-[1.4] text-slate-200">
            Two scrambled eggs, 80 grams of oats and a banana
            <span className="ml-[3px] inline-block h-[15px] w-0.5 animate-fv-blink bg-accent align-[-2px]" />
          </p>
          <div className="flex size-[38px] shrink-0 animate-fv-pulse items-center justify-center rounded-full bg-accent">
            <Mic size={16} className="text-ink" />
          </div>
        </div>

        <Eyebrow className="flex items-center gap-[7px]">
          <span className="size-1.5 rounded-full bg-accent" /> AI resolved
        </Eyebrow>
        <div className="flex flex-col gap-2">
          {RESOLVED_ITEMS.map(([label, macros]) => (
            <div key={label} className="flex items-center justify-between rounded-[10px] bg-white/[0.03] px-[13px] py-2.5">
              <span className="text-sm text-slate-200">{label}</span>
              <span className="font-mono text-xs text-accent">{macros}</span>
            </div>
          ))}
        </div>

        <div className="mt-[18px] flex items-center justify-between border-t border-white/[0.07] pt-4">
          <span className="text-[13px] text-slate-500">Total logged</span>
          <span className="font-display text-[22px] font-bold text-slate-100">
            564 <span className="text-[13px] font-medium text-slate-500">kcal</span>
          </span>
        </div>
      </div>

      <div className="absolute -top-[18px] -right-3.5 animate-fv-float rounded-xl bg-accent px-[15px] py-[9px] text-[13px] font-bold text-ink shadow-[0_14px_30px_-8px_rgba(201,242,77,0.5)]">
        ⚡ 4.2s
      </div>
    </div>
  );
}
