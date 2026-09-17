import { forwardRef, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { Banner } from "@/components/ui";
import { logFrequentMeal } from "../api";
import type { FrequentMeal, QuickLogResponse } from "../types";

interface PortionEditorSheetProps {
  meal: FrequentMeal | null;
  onLogged: (result: QuickLogResponse) => void;
}

/** Presented via a parent-held ref: `sheetRef.current?.present()`, after
 * setting `meal` to the frequent meal being adjusted. */
export const PortionEditorSheet = forwardRef<BottomSheetModal, PortionEditorSheetProps>(
  function PortionEditorSheet({ meal, onLogged }, ref) {
    const [grams, setGrams] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      if (!meal) return;
      const initial: Record<string, string> = {};
      meal.ingredients.forEach((ing) => {
        initial[ing.name] = String(ing.weight_g);
      });
      setGrams(initial);
      setError("");
    }, [meal]);

    const dismiss = () => {
      if (ref && "current" in ref) ref.current?.dismiss();
    };

    const scaledTotals = useMemo(() => {
      if (!meal) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      return meal.ingredients.reduce(
        (acc, ing) => {
          const g = Number(grams[ing.name]);
          const grams_ = Number.isFinite(g) ? g : ing.weight_g;
          acc.calories += (ing.calories_per_100g * grams_) / 100;
          acc.protein += (ing.protein_per_100g * grams_) / 100;
          acc.carbs += (ing.carbs_per_100g * grams_) / 100;
          acc.fat += (ing.fat_per_100g * grams_) / 100;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    }, [meal, grams]);

    const handleLog = async () => {
      if (!meal) return;
      setError("");
      const values = Object.values(grams).map(Number);
      if (values.some((v) => Number.isNaN(v) || v < 0)) {
        setError("Portions must be valid, non-negative numbers.");
        return;
      }
      setSaving(true);
      try {
        const portions: Record<string, number> = {};
        meal.ingredients.forEach((ing) => {
          portions[ing.name] = Number(grams[ing.name]);
        });
        const result = await logFrequentMeal(meal.id, portions);
        onLogged(result);
        dismiss();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to log meal.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <BottomSheetModal
        ref={ref}
        backgroundStyle={{ backgroundColor: "#16180F" }}
        handleIndicatorStyle={{ backgroundColor: "#2A2D1E" }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.55} />
        )}
      >
        <BottomSheetView className="gap-3 px-5 pb-8 pt-1">
          <View className="border-b border-border-subtle pb-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-base text-text-primary">Adjust Portions</Text>
              <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close">
                <X size={18} color="#8E9085" />
              </Pressable>
            </View>
            {meal ? <Text className="font-mono text-xs text-text-secondary">{meal.display_name}</Text> : null}
          </View>

          {meal?.ingredients.map((ing) => (
            <View
              key={ing.name}
              className="flex-row items-center justify-between rounded-md border border-border-subtle bg-surface-inset px-3.5 py-2.5"
            >
              <Text className="font-sans text-[13px] text-text-primary" numberOfLines={1}>
                {ing.name}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <BottomSheetTextInput
                  value={grams[ing.name] ?? ""}
                  onChangeText={(text) => setGrams((prev) => ({ ...prev, [ing.name]: text }))}
                  keyboardType="numeric"
                  className="w-[64px] rounded-sm border border-border-subtle bg-bg px-2 py-2 text-center font-mono text-[13px] text-text-primary"
                />
                <Text className="font-sans text-[11px] text-text-muted">g</Text>
              </View>
            </View>
          ))}

          <View className="gap-1.5 rounded-md border border-border-subtle bg-surface-inset p-3.5">
            <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-text-muted">Scaled macros</Text>
            <View className="flex-row justify-between">
              <Text className="font-mono text-[13px] font-bold text-macro-calories">{Math.round(scaledTotals.calories)} kcal</Text>
              <Text className="font-mono text-xs text-macro-protein">{Math.round(scaledTotals.protein)}g P</Text>
              <Text className="font-mono text-xs text-macro-carbs">{Math.round(scaledTotals.carbs)}g C</Text>
              <Text className="font-mono text-xs text-macro-fat">{Math.round(scaledTotals.fat)}g F</Text>
            </View>
          </View>

          {error ? <Banner variant="error" message={error} /> : null}

          <Pressable
            onPress={handleLog}
            disabled={saving}
            className={`items-center rounded-full bg-accent py-3.5 ${saving ? "opacity-50" : ""}`}
          >
            <Text className="font-sans-bold text-[13px] text-bg">{saving ? "Logging…" : "Log with These Portions"}</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);
