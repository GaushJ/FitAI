"use client";

import { useState } from "react";
import { BarChart2 } from "lucide-react";
import { Card } from "@/components/atoms/Card";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { cn } from "@/lib/cn";
import type { CalendarWeek, MonthLabel } from "@/features/progress/calendar";
import { HeatmapGrid } from "@/features/progress/components/HeatmapGrid";
import { HeatmapTooltip, type TooltipState } from "@/features/progress/components/HeatmapTooltip";
import { LEGEND_STATUSES, STATUS_STYLES } from "@/features/progress/statusStyles";

function HeatmapLegend({ className }: { className: string }) {
  return (
    <div className={cn("items-center gap-3 text-[10px] text-slate-500", className)}>
      {LEGEND_STATUSES.map((status) => (
        <div key={status} className="flex items-center gap-1">
          <div className={cn("h-3 w-3 rounded-sm border", STATUS_STYLES[status].cell)} />
          <span className="capitalize">{STATUS_STYLES[status].label}</span>
        </div>
      ))}
    </div>
  );
}

interface ActivityHeatmapProps {
  weeks: CalendarWeek[];
  monthLabels: MonthLabel[];
}

/** GitHub-style 90-day calorie heatmap with a hover tooltip. */
export function ActivityHeatmap({ weeks, monthLabels }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  return (
    <Card>
      <SectionHeading
        size="md"
        className="mb-5"
        icon={<BarChart2 className="text-purple-400" />}
        subtitle="90 days of calorie logging — hover a cell for details"
        action={<HeatmapLegend className="hidden sm:flex" />}
      >
        Activity Heatmap
      </SectionHeading>

      <HeatmapGrid weeks={weeks} monthLabels={monthLabels} onHover={setTooltip} />
      <HeatmapLegend className="mt-4 flex flex-wrap sm:hidden" />

      {tooltip && <HeatmapTooltip {...tooltip} />}
    </Card>
  );
}
