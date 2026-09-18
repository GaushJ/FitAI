import { View, Text, Pressable } from "react-native";
import { Pencil, Trash2 } from "lucide-react-native";
import { EmptyState, ExpandableRow } from "@/components/ui";
import type { Ingredient, MealLog } from "../types";

interface TodayLogListProps {
  meals: MealLog[];
  onEditIngredient: (mealId: number, index: number, ingredient: Ingredient) => void;
  onDeleteMeal: (meal: MealLog) => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function TodayLogList({ meals, onEditIngredient, onDeleteMeal }: TodayLogListProps) {
  return (
    <View className="gap-2.5">
      <Text className="font-sans-semibold text-sm text-text-primary">Today's Meals</Text>
      {meals.length === 0 ? (
        <EmptyState label="No meals logged yet today" />
      ) : (
        meals.map((meal) => (
          <ExpandableRow
            key={meal.id}
            header={
              <View>
                <Text className="font-sans text-[13px] text-text-primary" numberOfLines={1}>
                  "{meal.raw_transcript}"
                </Text>
                <Text className="mt-1 font-mono text-[11px] text-text-secondary">
                  {formatTime(meal.date)} · {meal.ingredients.length} ingredient
                  {meal.ingredients.length === 1 ? "" : "s"}
                </Text>
                <View className="mt-1.5 flex-row items-center gap-2.5">
                  <Text className="font-mono text-[11px] font-bold text-macro-calories">
                    {Math.round(meal.macros.calories)} kcal
                  </Text>
                  <Text className="font-mono text-[10px] text-macro-protein">P {meal.macros.protein}g</Text>
                  <Text className="font-mono text-[10px] text-macro-carbs">C {meal.macros.carbs}g</Text>
                  <Text className="font-mono text-[10px] text-macro-fat">F {meal.macros.fat}g</Text>
                </View>
              </View>
            }
          >
            <View className="gap-2">
              {meal.ingredients.map((ing, idx) => (
                <View key={`${meal.id}-${idx}`} className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 font-sans text-xs text-text-tertiary" numberOfLines={1}>
                    {ing.brand ? `${ing.brand} ` : ""}
                    {ing.name} · {Math.round(ing.weight_g)}g
                  </Text>
                  <Text className="font-mono text-[11px] text-text-secondary">
                    {Math.round((ing.calories_per_100g * ing.weight_g) / 100)} kcal
                  </Text>
                  <Pressable
                    onPress={() => onEditIngredient(meal.id, idx, ing)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${ing.name}`}
                    hitSlop={8}
                  >
                    <Pencil size={13} color="#6E7066" />
                  </Pressable>
                </View>
              ))}

              <Pressable
                onPress={() => onDeleteMeal(meal)}
                accessibilityRole="button"
                accessibilityLabel={`Delete meal "${meal.raw_transcript}"`}
                className="mt-1 flex-row items-center justify-center gap-1.5 rounded-sm border border-danger/20 bg-danger-bg py-2"
              >
                <Trash2 size={13} color="#f87171" />
                <Text className="font-sans-semibold text-xs text-danger">Delete Meal</Text>
              </Pressable>
            </View>
          </ExpandableRow>
        ))
      )}
    </View>
  );
}
