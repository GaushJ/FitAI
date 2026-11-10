import { useState } from "react";
import { Text, View } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { SlidersHorizontal, Trash2, Zap } from "lucide-react-native";
import { Button, Card, IconButton, Input, MacroInline, MealTemplateCard, Modal, SectionHeading } from "@/components/ui";
import { roundMacros, sumIngredientMacros } from "@/lib/nutrition";
import type { FrequentMealsState } from "../hooks/useDashboardHooks";
import type { FrequentMeal } from "../types";

// Port of web's FrequentMealsSection + FrequentMealsRow + PortionEditorModal.
const DEFAULT_GRAMS = 100;

interface PortionEditorModalProps {
  meal: FrequentMeal;
  logging: boolean;
  onClose: () => void;
  onConfirm: (portions: Record<string, number>) => void;
}

/** Lets the user tweak each ingredient's grams before quick-logging a frequent meal. */
function PortionEditorModal({ meal, logging, onClose, onConfirm }: PortionEditorModalProps) {
  const [grams, setGrams] = useState<Record<string, number>>(() =>
    Object.fromEntries(meal.ingredients.filter((ing) => ing.name).map((ing) => [ing.name, ing.weight_g ?? DEFAULT_GRAMS]))
  );

  const gramsFor = (name: string, fallback: number) => grams[name] ?? fallback ?? DEFAULT_GRAMS;
  const estimate = roundMacros(sumIngredientMacros(meal.ingredients, (ing) => gramsFor(ing.name || "", ing.weight_g)));

  return (
    <Modal title="Adjust portions" icon={SlidersHorizontal} subtitle={meal.display_name} onClose={onClose}>
      {meal.ingredients.map((ing) => {
        const name = ing.name || "";
        return (
          <View key={name} className="flex-row items-center gap-3 border-b border-line pb-3">
            <Text className="flex-1 font-display-medium text-sm capitalize text-ink">{name}</Text>
            <View className="flex-row items-center gap-1.5">
              <Input
                size="sm"
                mono
                keyboardType="numeric"
                accessibilityLabel={`${name} grams`}
                className="w-20 text-right"
                value={String(gramsFor(name, ing.weight_g))}
                onChangeText={(v) => setGrams((prev) => ({ ...prev, [name]: Number(v) }))}
                InputComponent={BottomSheetTextInput}
              />
              <Text className="w-4 font-mono text-xs text-ink-muted">g</Text>
            </View>
          </View>
        );
      })}

      <View className="border border-line bg-surface-low p-3">
        <Text className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted">Estimated macros with these portions</Text>
        <MacroInline macros={estimate} />
      </View>

      <View className="flex-row gap-3 pt-2">
        <View className="flex-1">
          <Button variant="outline" fullWidth onPress={onClose}>
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button fullWidth icon={Zap} loading={logging} loadingText="Logging..." onPress={() => onConfirm(grams)}>
            Log portions
          </Button>
        </View>
      </View>
    </Modal>
  );
}

/** One-tap shortcuts for meals the user logs repeatedly, plus the portion-adjust dialog. */
export function FrequentMealsSection({ frequent }: { frequent: FrequentMealsState }) {
  const [adjusting, setAdjusting] = useState<FrequentMeal | null>(null);
  if (frequent.meals.length === 0) return null;

  return (
    <>
      <Card>
        <SectionHeading className="mb-4" subtitle="Based on your history">
          Frequent meals
        </SectionHeading>

        <View className="gap-3">
          {frequent.meals.map((meal) => (
            <MealTemplateCard
              key={meal.id}
              name={meal.display_name}
              macros={meal.macros}
              meta={`${meal.log_count}× logged`}
              actions={
                <>
                  <Button variant="dark" size="xs" icon={Zap} loading={frequent.loggingId === meal.id} onPress={() => frequent.quickLog(meal)}>
                    Log
                  </Button>
                  <IconButton label="Adjust portions before logging" variant="outline" icon={SlidersHorizontal} onPress={() => setAdjusting(meal)} />
                  <IconButton
                    label="Remove from frequent meals"
                    variant="danger"
                    icon={Trash2}
                    className="ml-auto"
                    onPress={() => frequent.remove(meal.id)}
                  />
                </>
              }
            />
          ))}
        </View>
      </Card>

      {adjusting ? (
        <PortionEditorModal
          meal={adjusting}
          logging={frequent.loggingId === adjusting.id}
          onClose={() => setAdjusting(null)}
          onConfirm={async (portions) => {
            if (await frequent.quickLog(adjusting, portions)) setAdjusting(null);
          }}
        />
      ) : null}
    </>
  );
}
