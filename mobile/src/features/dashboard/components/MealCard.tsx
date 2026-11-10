import { Pressable, Text, View } from "react-native";
import { ChevronDown, Pencil } from "lucide-react-native";
import { IconButton, IngredientLabel, MacroInline } from "@/components/ui";
import { actualMacros, pluralize } from "@/lib/nutrition";
import { colors } from "@/theme/colors";
import type { Ingredient, Macros } from "@/types/nutrition";
import type { MealLog } from "../types";

// Port of web's features/meals/components/MealCard.tsx + IngredientCardList.tsx (the phone-width breakdown).

interface IngredientCardListProps {
  ingredients: Ingredient[];
  total?: Macros;
  onEdit?: (index: number, ingredient: Ingredient) => void;
}

/** Each ingredient gets a name + weight line and a wrapping row of labelled macros. */
function IngredientCardList({ ingredients, total, onEdit }: IngredientCardListProps) {
  return (
    <View className="gap-3">
      {ingredients.map((ing, index) => (
        <View key={index} className={`gap-1 pb-3 ${index < ingredients.length - 1 || total ? "border-b border-line" : ""}`}>
          <View className="flex-row items-start justify-between gap-2">
            <IngredientLabel name={ing.name} brand={ing.brand} />
            <View className="flex-row items-center gap-1.5">
              <Text className="font-mono text-[11px] text-ink-muted">{ing.weight_g}g</Text>
              {onEdit ? (
                <IconButton label="Edit this ingredient's macros" size="xs" icon={Pencil} onPress={() => onEdit(index, ing)} />
              ) : null}
            </View>
          </View>
          <MacroInline macros={actualMacros(ing)} size="sm" className="pl-3.5" />
        </View>
      ))}

      {total ? (
        <View className="flex-row items-center justify-between gap-3 border-t-2 border-ink pt-2">
          <Text className="font-mono-medium text-[11px] uppercase tracking-widest text-ink">Total</Text>
          <MacroInline macros={total} size="sm" className="flex-1 justify-end" />
        </View>
      ) : null}
    </View>
  );
}

interface MealCardProps {
  meal: Pick<MealLog, "raw_transcript" | "macros" | "ingredients">;
  dateLabel: string;
  expanded: boolean;
  onToggle: () => void;
  /** Icon buttons pinned beside the header, outside the expand toggle. */
  actions?: React.ReactNode;
  /** Adds a summary row to the expanded breakdown. */
  showTotal?: boolean;
  onEditIngredient?: (index: number, ingredient: Ingredient) => void;
}

/** A logged meal: transcript + macro block, expanding into its ingredient breakdown. */
export function MealCard({ meal, dateLabel, expanded, onToggle, actions, showTotal, onEditIngredient }: MealCardProps) {
  const { macros } = meal;

  return (
    <View className={`border bg-card ${expanded ? "border-ink" : "border-line"}`}>
      <View className={`flex-row items-start ${expanded ? "bg-surface-low" : ""}`}>
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          className="min-w-0 flex-1 gap-3 p-4"
        >
          <View className="flex-row gap-3">
            <View className="mt-1.5 h-2 w-2 bg-primary" />
            <View className="min-w-0 flex-1">
              <Text className="font-display-medium text-base italic leading-snug text-ink">&ldquo;{meal.raw_transcript}&rdquo;</Text>
              <Text className="mt-1 font-mono text-[11px] text-ink-muted">
                {dateLabel} · {pluralize(meal.ingredients.length, "ingredient")}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3 self-end">
            <View className="flex-row items-center gap-4 border border-line bg-card px-3 py-2">
              <View className="items-center">
                <Text className="font-display text-2xl leading-none text-primary">{Math.round(macros.calories)}</Text>
                <Text className="font-mono text-[10px] uppercase text-ink-muted">kcal</Text>
              </View>
              <View className="flex-row gap-3">
                {(
                  [
                    ["P", macros.protein],
                    ["C", macros.carbs],
                    ["F", macros.fat],
                  ] as const
                ).map(([label, value]) => (
                  <View key={label}>
                    <Text className="font-mono text-[11px] text-ink-muted">{label}</Text>
                    <Text className="font-mono text-[11px] text-ink">{value}g</Text>
                  </View>
                ))}
              </View>
            </View>
            <ChevronDown size={16} color={colors.inkMuted} style={expanded ? { transform: [{ rotate: "180deg" }] } : undefined} />
          </View>
        </Pressable>

        {actions ? <View className="gap-1 p-2">{actions}</View> : null}
      </View>

      {expanded ? (
        <View className="border-t border-line px-4 pb-4 pt-3">
          <IngredientCardList ingredients={meal.ingredients} total={showTotal ? meal.macros : undefined} onEdit={onEditIngredient} />
        </View>
      ) : null}
    </View>
  );
}
