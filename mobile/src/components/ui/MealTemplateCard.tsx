import { Text, View } from "react-native";
import type { Macros } from "@/types/nutrition";

// Mirrors frontend/src/components/molecules/MealTemplateCard.tsx.
interface MealTemplateCardProps {
  name: string;
  macros: Macros;
  /** Small tag in the top-right corner, e.g. "4× logged". */
  meta: string;
  /** Optional muted line under the name, e.g. the ingredient list. */
  description?: string;
  /** Action buttons along the bottom of the card. */
  actions: React.ReactNode;
}

/** A frequent or saved meal: name, calories, macro split and quick actions. */
export function MealTemplateCard({ name, macros, meta, description, actions }: MealTemplateCardProps) {
  return (
    <View className="border border-line bg-surface-low p-4">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 font-display-semibold text-lg leading-tight text-ink">{name}</Text>
        <Text className="bg-surface-highest px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">{meta}</Text>
      </View>
      {description ? (
        <Text className="mt-1 font-mono text-[11px] text-ink-muted" numberOfLines={2}>
          {description}
        </Text>
      ) : null}
      <Text className="mt-1 font-display-semibold text-xl text-primary">{Math.round(macros.calories)} kcal</Text>
      <Text className="font-mono text-[11px] text-ink-muted">
        P {macros.protein}g · C {macros.carbs}g · F {macros.fat}g
      </Text>
      <View className="mt-3 flex-row items-center gap-1.5 border-t border-line pt-3">{actions}</View>
    </View>
  );
}
