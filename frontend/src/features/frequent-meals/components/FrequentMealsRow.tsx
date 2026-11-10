import { SlidersHorizontal, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { IconButton } from "@/components/atoms/IconButton";
import { MealTemplateCard } from "@/components/molecules/MealTemplateCard";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import type { FrequentMeal } from "@/features/frequent-meals/types";

interface FrequentMealsRowProps {
  meals: FrequentMeal[];
  loggingId: number | null;
  onLog: (meal: FrequentMeal) => void;
  onAdjustPortions: (meal: FrequentMeal) => void;
  onRemove: (mealId: number) => void;
}

/** One-tap shortcuts for meals the user logs repeatedly. */
export function FrequentMealsRow({ meals, loggingId, onLog, onAdjustPortions, onRemove }: FrequentMealsRowProps) {
  if (meals.length === 0) return null;

  return (
    <Card>
      <SectionHeading className="mb-4" subtitle="Based on your history">
        Frequent meals
      </SectionHeading>

      <div className="space-y-3">
        {meals.map((meal) => (
          <MealTemplateCard
            key={meal.id}
            name={meal.display_name}
            macros={meal.macros}
            meta={`${meal.log_count}× logged`}
            actions={
              <>
                <Button
                  variant="dark"
                  size="xs"
                  icon={<Zap />}
                  loading={loggingId === meal.id}
                  title="Log this meal now"
                  onClick={() => onLog(meal)}
                >
                  Log
                </Button>
                <IconButton label="Adjust portions before logging" variant="outline" onClick={() => onAdjustPortions(meal)}>
                  <SlidersHorizontal />
                </IconButton>
                <IconButton
                  label="Remove from frequent meals"
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
    </Card>
  );
}
