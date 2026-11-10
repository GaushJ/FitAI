import { ActivityIndicator, Text, View } from "react-native";
import { Apple, Bookmark, Trash2 } from "lucide-react-native";
import { Card, EmptyState, IconButton, SectionHeading } from "@/components/ui";
import { pluralize } from "@/lib/nutrition";
import { colors } from "@/theme/colors";
import type { Ingredient, Macros } from "@/types/nutrition";
import type { MealLog } from "../types";
import { MealCard } from "./MealCard";

// Port of web's features/meals/components/TodayMeals.tsx.
export interface IngredientEditTarget {
  mealId: number;
  index: number;
  ingredient: Ingredient;
}

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
        action={<Text className="font-mono text-sm uppercase tracking-widest text-ink-muted">{pluralize(meals.length, "meal")} logged</Text>}
      >
        Today&apos;s meals
      </SectionHeading>

      {loading ? (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : meals.length === 0 ? (
        <EmptyState icon={Apple} title="No food logged today">
          Type, speak or scan your first meal above to see it here.
        </EmptyState>
      ) : (
        <>
          <View className="gap-3">
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
                    <IconButton label="Save this as a reusable meal" icon={Bookmark} onPress={() => onSaveAsMeal(meal)} />
                    {deletingId === meal.id ? (
                      <View className="h-8 w-8 items-center justify-center">
                        <ActivityIndicator size="small" color={colors.inkMuted} />
                      </View>
                    ) : (
                      <IconButton label="Delete this meal" variant="danger" icon={Trash2} onPress={() => onDelete(meal.id)} />
                    )}
                  </>
                }
              />
            ))}
          </View>

          <View className="mt-5 gap-1 border-t-2 border-ink pt-4">
            <Text className="font-mono text-sm uppercase tracking-wide text-ink">{"// "}Today&apos;s totals</Text>
            <Text className="font-mono-medium text-sm uppercase tracking-wide text-ink">
              {Math.round(totals.calories).toLocaleString()} kcal · {Math.round(totals.protein)}g P · {Math.round(totals.carbs)}g C ·{" "}
              {Math.round(totals.fat)}g F
            </Text>
          </View>
        </>
      )}
    </Card>
  );
}
