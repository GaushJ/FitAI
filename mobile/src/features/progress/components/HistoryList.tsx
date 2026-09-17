import { View, Text, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { EmptyState, ExpandableRow, LoadingSpinner } from "@/components/ui";
import type { HistoryMeal } from "../types";

interface HistoryListProps {
  meals: HistoryMeal[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

export function HistoryList({ meals, total, page, totalPages, loading, onPrevPage, onNextPage }: HistoryListProps) {
  return (
    <View className="gap-2.5 rounded-lg border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-display text-sm text-text-primary">Meal History</Text>
          <Text className="mt-0.5 font-sans text-[10px] text-text-secondary">{total} meals logged in total</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={onPrevPage}
            disabled={page <= 1 || loading}
            accessibilityRole="button"
            accessibilityLabel="Previous page"
            className={`h-6 w-6 items-center justify-center rounded-xs bg-surface-high ${page <= 1 || loading ? "opacity-35" : ""}`}
          >
            <ChevronLeft size={13} color="#C9C9C9" />
          </Pressable>
          <Text className="font-sans text-[9.5px] text-text-secondary">
            Page {page} of {totalPages}
          </Text>
          <Pressable
            onPress={onNextPage}
            disabled={page >= totalPages || loading}
            accessibilityRole="button"
            accessibilityLabel="Next page"
            className={`h-6 w-6 items-center justify-center rounded-xs bg-surface-high ${page >= totalPages || loading ? "opacity-35" : ""}`}
          >
            <ChevronRight size={13} color="#C9C9C9" />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : meals.length === 0 ? (
        <EmptyState label="No meals logged yet. Start tracking on the dashboard!" />
      ) : (
        meals.map((meal) => (
          <ExpandableRow
            key={meal.id}
            header={
              <View>
                <Text className="font-sans text-xs italic text-text-primary" numberOfLines={1}>
                  &ldquo;{meal.raw_transcript}&rdquo;
                </Text>
                <Text className="mt-1 font-mono text-[9.5px] text-text-muted">
                  {formatDate(meal.date)} &middot; {meal.ingredients.length} ingredient
                  {meal.ingredients.length === 1 ? "" : "s"}
                </Text>
              </View>
            }
          >
            <View className="gap-1.5">
              <View className="mb-1 flex-row justify-end gap-2.5">
                <Text className="font-mono text-[11px] font-bold text-macro-calories">
                  {Math.round(meal.macros.calories)} kcal
                </Text>
                <Text className="font-mono text-[10px] text-macro-protein">P{meal.macros.protein}</Text>
                <Text className="font-mono text-[10px] text-macro-carbs">C{meal.macros.carbs}</Text>
                <Text className="font-mono text-[10px] text-macro-fat">F{meal.macros.fat}</Text>
              </View>
              {meal.ingredients.map((ing, idx) => (
                <View key={`${meal.id}-${idx}`} className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 font-sans text-xs capitalize text-text-tertiary" numberOfLines={1}>
                    {ing.brand ? `${ing.brand} ` : ""}
                    {ing.name} &middot; {Math.round(ing.weight_g)}g
                  </Text>
                  <Text className="font-mono text-[11px] text-text-secondary">
                    {Math.round((ing.calories_per_100g * ing.weight_g) / 100)} kcal
                  </Text>
                </View>
              ))}
            </View>
          </ExpandableRow>
        ))
      )}
    </View>
  );
}
