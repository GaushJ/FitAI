import { Pencil, Plus, Trash2, Zap } from "lucide-react";
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
    <Card>
      <SectionHeading
        className="mb-4"
        subtitle="Reusable templates"
        action={
          <Button variant="ghost" size="xs" icon={<Plus />} className="text-primary" onClick={onNew}>
            New
          </Button>
        }
      >
        Saved meals
      </SectionHeading>

      {meals.length === 0 ? (
        <EmptyState size="sm">
          Save meals you eat often — e.g. &quot;Omelette + Protein Shake&quot; — then log them in one tap.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => (
            <MealTemplateCard
              key={meal.id}
              name={meal.name}
              macros={meal.macros}
              meta={pluralize(meal.ingredients.length, "item")}
              description={meal.ingredients.map((ing) => ing.name).join(", ")}
              actions={
                <>
                  <Button
                    variant="dark"
                    size="xs"
                    icon={<Zap />}
                    loading={loggingId === meal.id}
                    title="Log this meal now, exactly as saved"
                    onClick={() => onLog(meal)}
                  >
                    Log meal
                  </Button>
                  <IconButton
                    label="Change quantities, add/remove ingredients, or rename"
                    variant="outline"
                    onClick={() => onEdit(meal)}
                  >
                    <Pencil />
                  </IconButton>
                  <IconButton
                    label="Delete this saved meal"
                    variant="danger"
                    className="ml-auto"
                    onClick={() => onRemove(meal.id)}
                  >
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
