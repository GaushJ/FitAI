"use client";

import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { Card } from "@/components/atoms/Card";
import { IconButton } from "@/components/atoms/IconButton";
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
        icon={<BookOpen />}
        subtitle={`${history.total} meals logged in total`}
        className="mb-6 border-b border-line pb-4"
        action={
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-ink">Page {history.page}</span>
            <div className="flex border border-line">
              <IconButton
                label="Previous page"
                disabled={!history.hasPrevious || history.loading}
                onClick={() => history.goToPage(history.page - 1)}
              >
                <ArrowLeft />
              </IconButton>
              <IconButton
                label="Next page"
                className="border-l border-line"
                disabled={!history.hasNext || history.loading}
                onClick={() => history.goToPage(history.page + 1)}
              >
                <ArrowRight />
              </IconButton>
            </div>
          </div>
        }
      >
        Meal history
      </SectionHeading>

      {history.loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-7 text-primary" />
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
