"use client";

import { Calendar } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Spinner } from "@/components/atoms/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { formatShortDate } from "@/lib/format";
import { MealCard } from "@/features/meals/components/MealCard";
import { useExpandedMeals } from "@/features/meals/hooks/useExpandedMeals";
import type { useMealHistory } from "@/features/progress/hooks/useMealHistory";

export function MealHistory({ history }: { history: ReturnType<typeof useMealHistory> }) {
  const expanded = useExpandedMeals();

  return (
    <Card>
      <SectionHeading
        size="md"
        className="mb-5"
        icon={<Calendar className="text-purple-400" />}
        subtitle={`${history.total} meals logged in total`}
        action={
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Page {history.page}</span>
            <div className="flex gap-1">
              <Button
                variant="secondary"
                size="xs"
                aria-label="Previous page"
                disabled={!history.hasPrevious || history.loading}
                onClick={() => history.goToPage(history.page - 1)}
              >
                ←
              </Button>
              <Button
                variant="secondary"
                size="xs"
                aria-label="Next page"
                disabled={!history.hasNext || history.loading}
                onClick={() => history.goToPage(history.page + 1)}
              >
                →
              </Button>
            </div>
          </div>
        }
      >
        Meal History
      </SectionHeading>

      {history.loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-7 text-purple-500" />
        </div>
      ) : history.meals.length === 0 ? (
        <EmptyState bordered={false}>No meals logged yet. Start tracking on the dashboard!</EmptyState>
      ) : (
        <div className="space-y-3">
          {history.meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              dateLabel={formatShortDate(meal.date)}
              expanded={expanded.expandedIds.has(meal.id)}
              onToggle={() => expanded.toggle(meal.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
