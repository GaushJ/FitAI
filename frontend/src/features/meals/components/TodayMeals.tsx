import { Apple, Bookmark, Calendar, Trash2 } from "lucide-react";
import { Card } from "@/components/atoms/Card";
import { IconButton } from "@/components/atoms/IconButton";
import { Spinner } from "@/components/atoms/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { MealCard } from "@/features/meals/components/MealCard";
import type { IngredientEditTarget, MealLog } from "@/features/meals/types";

interface TodayMealsProps {
  meals: MealLog[];
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
  loading,
  expandedIds,
  deletingId,
  onToggle,
  onDelete,
  onSaveAsMeal,
  onEditIngredient,
}: TodayMealsProps) {
  return (
    <Card className="flex flex-1 flex-col">
      <SectionHeading icon={<Calendar className="text-accent" />} className="mb-4">
        Today&apos;s Meals ({meals.length})
      </SectionHeading>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <Spinner className="size-8 text-accent" />
        </div>
      ) : meals.length === 0 ? (
        <EmptyState icon={<Apple />} title="No food logged today" className="flex-1">
          Type or speak your meals above to see them logged here.
        </EmptyState>
      ) : (
        <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              dateLabel={new Date(meal.date).toLocaleDateString()}
              expanded={expandedIds.has(meal.id)}
              onToggle={() => onToggle(meal.id)}
              showTotal
              onEditIngredient={(index, ingredient) =>
                onEditIngredient({ mealId: meal.id, index, ingredient })
              }
              actions={
                <>
                  <IconButton
                    label="Save this as a reusable meal"
                    variant="outline-accent"
                    className="self-center"
                    onClick={() => onSaveAsMeal(meal)}
                  >
                    <Bookmark />
                  </IconButton>
                  <IconButton
                    label="Delete this meal"
                    variant="outline-danger"
                    className="self-center"
                    disabled={deletingId === meal.id}
                    onClick={() => onDelete(meal.id)}
                  >
                    {deletingId === meal.id ? <Spinner className="size-3.5" /> : <Trash2 />}
                  </IconButton>
                </>
              }
            />
          ))}
        </div>
      )}
    </Card>
  );
}
