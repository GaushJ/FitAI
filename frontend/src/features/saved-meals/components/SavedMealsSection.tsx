import { Bookmark, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { IconButton } from "@/components/atoms/IconButton";
import { EmptyState } from "@/components/molecules/EmptyState";
import { MealTemplateCard } from "@/components/molecules/MealTemplateCard";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { pluralize } from "@/lib/nutrition";
import type { SavedMeal } from "@/features/saved-meals/types";

interface SavedMealsSectionProps {
  meals: SavedMeal[];
  loggingId: number | null;
  onNew: () => void;
  onLog: (meal: SavedMeal) => void;
  onEdit: (meal: SavedMeal) => void;
  onRemove: (mealId: number) => void;
}

export function SavedMealsSection({ meals, loggingId, onNew, onLog, onEdit, onRemove }: SavedMealsSectionProps) {
  return (
    <Card padding="md">
      <SectionHeading
        size="sm"
        className="mb-3"
        icon={<Bookmark className="text-accent" />}
        action={
          <Button size="xs" icon={<Plus />} onClick={onNew}>
            New
          </Button>
        }
      >
        Saved Meals
      </SectionHeading>

      {meals.length === 0 ? (
        <EmptyState size="sm">
          Save meals you eat often — e.g. &quot;Omelette + Protein Shake&quot; — then log them in one tap and
          tweak quantities or add ingredients each time.
        </EmptyState>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {meals.map((meal) => (
            <MealTemplateCard
              key={meal.id}
              name={meal.name}
              macros={meal.macros}
              meta={pluralize(meal.ingredients.length, "ingredient")}
              actions={
                <>
                  <Button
                    size="xs"
                    className="flex-1"
                    icon={<Bookmark />}
                    loading={loggingId === meal.id}
                    title="Log this meal now, exactly as saved"
                    onClick={() => onLog(meal)}
                  >
                    Log
                  </Button>
                  <IconButton label="Change quantities, add/remove ingredients, or rename" onClick={() => onEdit(meal)}>
                    <Pencil />
                  </IconButton>
                  <IconButton label="Delete this saved meal" variant="danger" onClick={() => onRemove(meal.id)}>
                    <Trash2 />
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
