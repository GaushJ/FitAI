import { View, Text, Pressable } from "react-native";
import { Pencil } from "lucide-react-native";
import { EmptyState, ExpandableRow } from "@/components/ui";
import type { Ingredient, MealLog } from "../types";

interface TodayLogListProps {
  meals: MealLog[];
  onEditIngredient: (mealId: number, index: number, ingredient: Ingredient) => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function TodayLogList({ meals, onEditIngredient }: TodayLogListProps) {
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
                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="font-mono text-[11px] text-text-secondary">
                    {formatTime(meal.date)} · {meal.ingredients.length} ingredient
                    {meal.ingredients.length === 1 ? "" : "s"}
                  </Text>
                  <Text className="font-mono text-[11px] font-bold text-macro-calories">
                    {Math.round(meal.macros.calories)} kcal
                  </Text>
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
            </View>
          </ExpandableRow>
        ))
      )}
    </View>
  );
}
