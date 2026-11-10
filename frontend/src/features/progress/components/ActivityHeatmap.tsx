"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/atoms/Card";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { cn } from "@/lib/cn";
import type { CalendarWeek, MonthLabel } from "@/features/progress/calendar";
import { HeatmapGrid } from "@/features/progress/components/HeatmapGrid";
import { HeatmapTooltip, type TooltipState } from "@/features/progress/components/HeatmapTooltip";
import { LEGEND_STATUSES, STATUS_STYLES } from "@/features/progress/statusStyles";

function HeatmapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-ink-muted">
      {LEGEND_STATUSES.map((status) => (
        <span key={status} className="flex items-center gap-1.5">
          <span className={cn("size-3", STATUS_STYLES[status].cell)} />
          {STATUS_STYLES[status].label}
        </span>
      ))}
    </div>
  );
}

interface ActivityHeatmapProps {
  weeks: CalendarWeek[];
  monthLabels: MonthLabel[];
}

/** 90-day calorie heatmap with a hover tooltip. */
export function ActivityHeatmap({ weeks, monthLabels }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  return (
    <Card>
      <SectionHeading
        icon={<BarChart3 />}
        subtitle="90 days of calorie logging — hover a cell for details"
        action={<HeatmapLegend />}
        className="mb-6 border-b border-line pb-4"
      >
        Activity heatmap
      </SectionHeading>

      <HeatmapGrid weeks={weeks} monthLabels={monthLabels} onHover={setTooltip} />

      {tooltip && <HeatmapTooltip {...tooltip} />}
    </Card>
  );
}
