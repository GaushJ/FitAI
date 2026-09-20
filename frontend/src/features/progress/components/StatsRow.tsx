import type { ReactNode } from "react";
import { Award, Calendar, Flame, Utensils } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ProgressStats } from "@/features/progress/types";

interface StatTileProps {
  icon: ReactNode;
  label: string;
  value: string;
  /** Gradient + border classes tinting the tile. */
  surfaceClassName: string;
}

function StatTile({ icon, label, value, surfaceClassName }: StatTileProps) {
  return (
    <div className={cn("rounded-2xl border bg-linear-to-br p-5", surfaceClassName)}>
      <div className="mb-2 flex items-center gap-2 [&>svg]:size-5">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-100">{value}</p>
    </div>
  );
}

export function StatsRow({ stats }: { stats: ProgressStats | null }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatTile
        icon={<Flame className="text-orange-400" />}
        label="Current Streak"
        value={`${stats?.current_streak ?? 0} days`}
        surfaceClassName="from-orange-950/30 to-red-950/30 border-orange-900/40"
      />
      <StatTile
        icon={<Award className="text-yellow-400" />}
        label="Best Streak"
        value={`${stats?.best_streak ?? 0} days`}
        surfaceClassName="from-yellow-950/30 to-amber-950/30 border-yellow-900/40"
      />
      <StatTile
        icon={<Calendar className="text-cyan-400" />}
        label="Days Logged"
        value={`${stats?.total_days_logged ?? 0} days`}
        surfaceClassName="from-cyan-950/30 to-teal-950/30 border-cyan-900/40"
      />
      <StatTile
        icon={<Utensils className="text-purple-400" />}
        label="Total Meals"
        value={`${stats?.total_meals ?? 0} meals`}
        surfaceClassName="from-purple-950/30 to-indigo-950/30 border-purple-900/40"
      />
    </div>
  );
}
