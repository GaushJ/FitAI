import { Dumbbell } from "lucide-react";

export function TipsCard() {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-900 bg-slate-900/20 p-4 text-xs text-slate-400">
      <Dumbbell className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
      <div>
        <p className="font-semibold text-slate-300">Tips</p>
        <p className="mt-1 leading-normal">
          Mention brand names naturally — &ldquo;200ml Nandini milk&rdquo; or &ldquo;1 scoop Optimum Nutrition
          whey&rdquo; — whether you type or speak them. Save brand preferences via the{" "}
          <span className="font-semibold text-accent">Brands</span> button to lock in exact label macros forever.
        </p>
      </div>
    </div>
  );
}
