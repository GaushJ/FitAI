import { View } from "react-native";
import { Pencil, Plus, Trash2, Zap } from "lucide-react-native";
import { Button, Card, EmptyState, IconButton, MealTemplateCard, SectionHeading } from "@/components/ui";
import { pluralize } from "@/lib/nutrition";
import { colors } from "@/theme/colors";
import type { SavedMeal } from "../types";

// Port of web's features/saved-meals/components/SavedMealsSection.tsx.
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
          <Button variant="ghost" size="xs" icon={Plus} iconColor={colors.primary} textClassName="text-primary" onPress={onNew}>
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
        <View className="gap-3">
          {meals.map((meal) => (
            <MealTemplateCard
              key={meal.id}
              name={meal.name}
              macros={meal.macros}
              meta={pluralize(meal.ingredients.length, "item")}
              description={meal.ingredients.map((ing) => ing.name).join(", ")}
              actions={
                <>
                  <Button variant="dark" size="xs" icon={Zap} loading={loggingId === meal.id} onPress={() => onLog(meal)}>
                    Log meal
                  </Button>
                  <IconButton
                    label="Change quantities, add/remove ingredients, or rename"
                    variant="outline"
                    icon={Pencil}
                    onPress={() => onEdit(meal)}
                  />
                  <IconButton label="Delete this saved meal" variant="danger" icon={Trash2} className="ml-auto" onPress={() => onRemove(meal.id)} />
                </>
              }
            />
          ))}
        </View>
      )}
    </Card>
  );
}
