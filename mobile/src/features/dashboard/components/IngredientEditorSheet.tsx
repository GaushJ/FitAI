import { forwardRef, useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { Banner } from "@/components/ui";
import { updateMealIngredient } from "../api";
import type { Ingredient } from "../types";

export interface IngredientEditTarget {
  mealId: number;
  index: number;
  ingredient: Ingredient;
}

interface IngredientEditorSheetProps {
  target: IngredientEditTarget | null;
  onSaved: (mealId: number) => void;
}

/** Presented via a parent-held ref: `sheetRef.current?.present()`, after
 * setting `target` to the ingredient being edited. */
export const IngredientEditorSheet = forwardRef<BottomSheetModal, IngredientEditorSheetProps>(
  function IngredientEditorSheet({ target, onSaved }, ref) {
    const [weight, setWeight] = useState("");
    const [calories, setCalories] = useState("");
    const [protein, setProtein] = useState("");
    const [carbs, setCarbs] = useState("");
    const [fat, setFat] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      if (!target) return;
      setWeight(String(target.ingredient.weight_g));
      setCalories(String(target.ingredient.calories_per_100g));
      setProtein(String(target.ingredient.protein_per_100g));
      setCarbs(String(target.ingredient.carbs_per_100g));
      setFat(String(target.ingredient.fat_per_100g));
      setError("");
    }, [target]);

    const dismiss = () => {
      if (ref && "current" in ref) ref.current?.dismiss();
    };

    const w = Number(weight);
    const cal = Number(calories);
    const pro = Number(protein);
    const carb = Number(carbs);
    const f = Number(fat);
    const scale = Number.isFinite(w) ? w / 100 : 0;
    const resulting = {
      calories: (Number.isFinite(cal) ? cal : 0) * scale,
      protein: (Number.isFinite(pro) ? pro : 0) * scale,
      carbs: (Number.isFinite(carb) ? carb : 0) * scale,
      fat: (Number.isFinite(f) ? f : 0) * scale,
    };

    const handleSave = async () => {
      if (!target) return;
      setError("");
      const values = [w, cal, pro, carb, f];
      if (values.some((v) => Number.isNaN(v) || v < 0)) {
        setError("All fields must be valid, non-negative numbers.");
        return;
      }
      setSaving(true);
      try {
        await updateMealIngredient(target.mealId, target.index, {
          weight_g: w,
          calories_per_100g: cal,
          protein_per_100g: pro,
          carbs_per_100g: carb,
          fat_per_100g: f,
        });
        onSaved(target.mealId);
        dismiss();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save ingredient.");
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
        <BottomSheetView className="gap-4 px-5 pb-8 pt-1">
          <View className="border-b border-border-subtle pb-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-base text-text-primary">Edit Ingredient</Text>
              <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close">
                <X size={18} color="#8E9085" />
              </Pressable>
            </View>
            {target ? <Text className="font-mono text-xs text-text-secondary">{target.ingredient.name}</Text> : null}
          </View>

          <Field label="Weight (g)" value={weight} onChangeText={setWeight} />

          <View className="flex-row flex-wrap gap-3">
            <Field label="Cal / 100g" labelColor="#fb923c" value={calories} onChangeText={setCalories} className="w-[47%]" />
            <Field label="Protein / 100g" labelColor="#C9F24D" value={protein} onChangeText={setProtein} className="w-[47%]" />
            <Field label="Carbs / 100g" labelColor="#22d3ee" value={carbs} onChangeText={setCarbs} className="w-[47%]" />
            <Field label="Fat / 100g" labelColor="#fb7185" value={fat} onChangeText={setFat} className="w-[47%]" />
          </View>

          <View className="gap-1.5 rounded-md border border-border-subtle bg-surface-inset p-3.5">
            <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-text-muted">Resulting macros</Text>
            <View className="flex-row justify-between">
              <Text className="font-mono text-[13px] font-bold text-macro-calories">{Math.round(resulting.calories)} kcal</Text>
              <Text className="font-mono text-xs text-macro-protein">{Math.round(resulting.protein)}g P</Text>
              <Text className="font-mono text-xs text-macro-carbs">{Math.round(resulting.carbs)}g C</Text>
              <Text className="font-mono text-xs text-macro-fat">{Math.round(resulting.fat)}g F</Text>
            </View>
          </View>

          {error ? <Banner variant="error" message={error} /> : null}

          <View className="flex-row gap-2.5">
            <Pressable onPress={dismiss} className="flex-1 items-center rounded-full border border-border bg-surface-high py-3">
              <Text className="font-sans-semibold text-[13px] text-text-secondary">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className={`flex-1 items-center rounded-full bg-accent py-3 ${saving ? "opacity-50" : ""}`}
            >
              <Text className="font-sans-bold text-[13px] text-bg">{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

function Field({
  label,
  labelColor = "#6E7066",
  value,
  onChangeText,
  className = "",
}: {
  label: string;
  labelColor?: string;
  value: string;
  onChangeText: (text: string) => void;
  className?: string;
}) {
  return (
    <View className={`gap-1.5 ${className}`}>
      <Text className="font-sans-bold text-[10px] uppercase tracking-widest" style={{ color: labelColor }}>
        {label}
      </Text>
      <BottomSheetTextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        className="rounded-sm border border-border-subtle bg-bg px-3.5 py-3 font-mono text-sm text-text-primary"
      />
    </View>
  );
}
