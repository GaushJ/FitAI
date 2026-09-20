import { Sliders, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { IconButton } from "@/components/atoms/IconButton";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { MealTemplateCard } from "@/components/molecules/MealTemplateCard";
import type { FrequentMeal } from "@/features/frequent-meals/types";

interface FrequentMealsRowProps {
  meals: FrequentMeal[];
  loggingId: number | null;
  onLog: (meal: FrequentMeal) => void;
  onAdjustPortions: (meal: FrequentMeal) => void;
  onRemove: (mealId: number) => void;
}

/** Horizontally scrolling shortcuts for meals the user logs repeatedly. */
export function FrequentMealsRow({ meals, loggingId, onLog, onAdjustPortions, onRemove }: FrequentMealsRowProps) {
  if (meals.length === 0) return null;

  return (
    <Card padding="md">
      <SectionHeading
        size="sm"
        className="mb-3"
        icon={<Zap className="text-yellow-400" />}
        action={
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Tap to quick-log</span>
        }
      >
        Frequent Meals
      </SectionHeading>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {meals.map((meal) => (
          <MealTemplateCard
            key={meal.id}
            name={meal.display_name}
            macros={meal.macros}
            meta={`${meal.log_count}× logged`}
            actions={
              <>
                <Button
                  size="xs"
                  className="flex-1"
                  icon={<Zap />}
                  loading={loggingId === meal.id}
                  title="Log this meal now"
                  onClick={() => onLog(meal)}
                >
                  Log
                </Button>
                <IconButton label="Adjust portions before logging" onClick={() => onAdjustPortions(meal)}>
                  <Sliders />
                </IconButton>
                <IconButton label="Remove from frequent meals" variant="danger" onClick={() => onRemove(meal.id)}>
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
