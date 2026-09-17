import { ScrollView, View, Text, Pressable } from "react-native";
import { Plus, Pencil, Trash2 } from "lucide-react-native";
import type { SavedMeal } from "../types";

interface SavedMealsRowProps {
  meals: SavedMeal[];
  onLog: (meal: SavedMeal) => void;
  onEdit: (meal: SavedMeal) => void;
  onDelete: (meal: SavedMeal) => void;
  onCreateNew: () => void;
  loggingId: number | null;
}

export function SavedMealsRow({ meals, onLog, onEdit, onDelete, onCreateNew, loggingId }: SavedMealsRowProps) {
  return (
    <View className="gap-2.5">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-semibold text-sm text-text-primary">Saved Meals</Text>
        <Pressable onPress={onCreateNew} className="flex-row items-center gap-1" accessibilityRole="button" accessibilityLabel="New saved meal">
          <Plus size={14} color="#C9F24D" />
          <Text className="font-sans-semibold text-xs text-accent">New</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5">
        {meals.map((meal) => (
          <View key={meal.id} className="w-[150px] gap-2 rounded-md border border-border bg-surface p-3">
            <Text className="font-sans-semibold text-xs text-text-primary" numberOfLines={1}>
              {meal.name}
            </Text>
            <Text className="font-mono text-[10px] text-text-secondary">
              {Math.round(meal.macros.calories)} kcal · {Math.round(meal.macros.protein)}g P
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Pressable
                onPress={() => onLog(meal)}
                disabled={loggingId === meal.id}
                className={`flex-1 items-center rounded-full bg-accent py-1.5 ${loggingId === meal.id ? "opacity-50" : ""}`}
              >
                <Text className="font-sans-bold text-[11px] text-bg">{loggingId === meal.id ? "Logging…" : "Log"}</Text>
              </Pressable>
              <Pressable
                onPress={() => onEdit(meal)}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${meal.name}`}
                className="h-6 w-6 items-center justify-center rounded-full bg-surface-high"
              >
                <Pencil size={11} color="#8E9085" />
              </Pressable>
              <Pressable
                onPress={() => onDelete(meal)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${meal.name}`}
                className="h-6 w-6 items-center justify-center rounded-full bg-surface-high"
              >
                <Trash2 size={11} color="#f87171" />
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable
          onPress={onCreateNew}
          className="w-[150px] items-center justify-center gap-1.5 rounded-md border border-dashed border-border p-3"
        >
          <Plus size={18} color="#6E7066" />
          <Text className="text-center font-sans text-[11px] text-text-muted">Save a meal template</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
