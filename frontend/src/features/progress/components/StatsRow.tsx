import type { LucideIcon } from "lucide-react";
import { CalendarCheck, Flame, Trophy, Utensils } from "lucide-react";
import type { ProgressStats } from "@/features/progress/types";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: number;
  unit: string;
}

function StatTile({ icon: Icon, label, value, unit }: StatTileProps) {
  return (
    <div className="border border-line bg-card p-5">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted">
        <Icon className="size-4 text-primary" />
        {label}
      </p>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-5xl font-bold leading-none text-ink">{value}</span>
        <span className="font-display text-xl font-semibold uppercase text-ink-muted">{unit}</span>
      </p>
    </div>
  );
}

export function StatsRow({ stats }: { stats: ProgressStats | null }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile icon={Flame} label="Current streak" value={stats?.current_streak ?? 0} unit="days" />
      <StatTile icon={Trophy} label="Best streak" value={stats?.best_streak ?? 0} unit="days" />
      <StatTile icon={CalendarCheck} label="Days logged" value={stats?.total_days_logged ?? 0} unit="days" />
      <StatTile icon={Utensils} label="Total meals" value={stats?.total_meals ?? 0} unit="meals" />
    </div>
  );
}
