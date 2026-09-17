import { ScrollView, View, Text, Pressable } from "react-native";
import { EmptyState } from "@/components/ui";
import type { FrequentMeal } from "../types";

interface FrequentMealsRowProps {
  meals: FrequentMeal[];
  onLog: (meal: FrequentMeal) => void;
  loggingId: number | null;
}

export function FrequentMealsRow({ meals, onLog, loggingId }: FrequentMealsRowProps) {
  return (
    <View className="gap-2.5">
      <Text className="font-sans-semibold text-sm text-text-primary">Frequent Meals</Text>
      {meals.length === 0 ? (
        <EmptyState label="Log the same meal twice and it'll show up here" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5">
          {meals.map((meal) => (
            <View key={meal.id} className="w-[150px] gap-2 rounded-md border border-border bg-surface p-3">
              <Text className="font-sans-semibold text-xs text-text-primary" numberOfLines={1}>
                {meal.display_name}
              </Text>
              <Text className="font-mono text-[10px] text-text-secondary">
                {Math.round(meal.macros.calories)} kcal · {Math.round(meal.macros.protein)}g P
              </Text>
              <Pressable
                onPress={() => onLog(meal)}
                disabled={loggingId === meal.id}
                className={`items-center rounded-full bg-accent py-1.5 ${loggingId === meal.id ? "opacity-50" : ""}`}
              >
                <Text className="font-sans-bold text-[11px] text-bg">
                  {loggingId === meal.id ? "Logging…" : "+ Log"}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
