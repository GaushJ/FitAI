import { Apple, Bookmark, Trash2 } from "lucide-react";
import { Card } from "@/components/atoms/Card";
import { IconButton } from "@/components/atoms/IconButton";
import { Spinner } from "@/components/atoms/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { pluralize } from "@/lib/nutrition";
import type { Macros } from "@/types/nutrition";
import { MealCard } from "@/features/meals/components/MealCard";
import type { IngredientEditTarget, MealLog } from "@/features/meals/types";

interface TodayMealsProps {
  meals: MealLog[];
  totals: Macros;
  loading: boolean;
  expandedIds: Set<number>;
  deletingId: number | null;
  onToggle: (mealId: number) => void;
  onDelete: (mealId: number) => void;
  onSaveAsMeal: (meal: MealLog) => void;
  onEditIngredient: (target: IngredientEditTarget) => void;
}

export function TodayMeals({
  meals,
  totals,
  loading,
  expandedIds,
  deletingId,
  onToggle,
  onDelete,
  onSaveAsMeal,
  onEditIngredient,
}: TodayMealsProps) {
  return (
    <Card>
      <SectionHeading
        index="03"
        className="mb-5 border-b border-line pb-4"
        action={
          <span className="font-mono text-sm uppercase tracking-widest text-ink-muted">
            {pluralize(meals.length, "meal")} logged
          </span>
        }
      >
        Today&apos;s meals
      </SectionHeading>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : meals.length === 0 ? (
        <EmptyState icon={<Apple />} title="No food logged today">
          Type, speak or scan your first meal above to see it here.
        </EmptyState>
      ) : (
        <>
          <div className="space-y-3">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                dateLabel={new Date(meal.date).toLocaleDateString()}
                expanded={expandedIds.has(meal.id)}
                onToggle={() => onToggle(meal.id)}
                showTotal
                onEditIngredient={(index, ingredient) => onEditIngredient({ mealId: meal.id, index, ingredient })}
                actions={
                  <>
                    <IconButton label="Save this as a reusable meal" onClick={() => onSaveAsMeal(meal)}>
                      <Bookmark />
                    </IconButton>
                    <IconButton
                      label="Delete this meal"
                      variant="danger"
                      disabled={deletingId === meal.id}
                      onClick={() => onDelete(meal.id)}
                    >
                      {deletingId === meal.id ? <Spinner /> : <Trash2 />}
                    </IconButton>
                  </>
                }
              />
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-1 border-t-2 border-ink pt-4 font-mono text-sm uppercase tracking-wide text-ink sm:flex-row sm:justify-between">
            <span>{"// "}Today&apos;s totals</span>
            <span className="font-medium">
              {Math.round(totals.calories).toLocaleString()} kcal · {Math.round(totals.protein)}g P ·{" "}
              {Math.round(totals.carbs)}g C · {Math.round(totals.fat)}g F
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
