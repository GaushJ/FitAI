import { forwardRef, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetTextInput, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { X, Plus } from "lucide-react-native";
import { Banner } from "@/components/ui";
import { createSavedMeal, logSavedMeal, resolveIngredient, updateSavedMeal } from "../api";
import type { LogSavedMealResponse, SavedMeal, SavedMealIngredient } from "../types";

export interface SavedMealEditorTarget {
  mode: "new" | "edit";
  meal: SavedMeal | null;
}

interface SavedMealEditorSheetProps {
  target: SavedMealEditorTarget | null;
  onSaved: (meal: SavedMeal) => void;
  onLogged: (result: LogSavedMealResponse) => void;
}

export const SavedMealEditorSheet = forwardRef<BottomSheetModal, SavedMealEditorSheetProps>(
  function SavedMealEditorSheet({ target, onSaved, onLogged }, ref) {
    const { height: windowHeight } = useWindowDimensions();
    const [name, setName] = useState("");
    const [ingredients, setIngredients] = useState<SavedMealIngredient[]>([]);
    const [newIngName, setNewIngName] = useState("");
    const [newIngBrand, setNewIngBrand] = useState("");
    const [newIngWeight, setNewIngWeight] = useState("100");
    const [resolving, setResolving] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      if (!target) return;
      setName(target.meal?.name ?? "");
      setIngredients(target.meal ? target.meal.ingredients.map((ing) => ({ ...ing })) : []);
      setNewIngName("");
      setNewIngBrand("");
      setNewIngWeight("100");
      setError("");
    }, [target]);

    const dismiss = () => {
      if (ref && "current" in ref) ref.current?.dismiss();
    };

    const totals = useMemo(
      () =>
        ingredients.reduce(
          (acc, ing) => {
            acc.calories += (ing.calories_per_100g * ing.weight_g) / 100;
            acc.protein += (ing.protein_per_100g * ing.weight_g) / 100;
            acc.carbs += (ing.carbs_per_100g * ing.weight_g) / 100;
            acc.fat += (ing.fat_per_100g * ing.weight_g) / 100;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        ),
      [ingredients]
    );

    const handleRemoveIngredient = (index: number) => {
      setIngredients((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddIngredient = async () => {
      if (!newIngName.trim()) return;
      setError("");
      setResolving(true);
      try {
        const weight = Number(newIngWeight) || 100;
        const macros = await resolveIngredient(newIngName.trim(), newIngBrand.trim(), weight);
        setIngredients((prev) => [
          ...prev,
          { name: newIngName.trim(), brand: newIngBrand.trim() || null, weight_g: weight, ...macros },
        ]);
        setNewIngName("");
        setNewIngBrand("");
        setNewIngWeight("100");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not resolve ingredient.");
      } finally {
        setResolving(false);
      }
    };

    const saveMeal = async (): Promise<SavedMeal | null> => {
      setError("");
      if (!name.trim()) {
        setError("Give this meal a name.");
        return null;
      }
      if (ingredients.length === 0) {
        setError("Add at least one ingredient.");
        return null;
      }
      setBusy(true);
      try {
        const saved =
          target?.mode === "edit" && target.meal
            ? await updateSavedMeal(target.meal.id, name.trim(), ingredients)
            : await createSavedMeal(name.trim(), ingredients);
        onSaved(saved);
        return saved;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save meal.");
        return null;
      } finally {
        setBusy(false);
      }
    };

    const handleSaveMeal = async () => {
      const saved = await saveMeal();
      if (saved) dismiss();
    };

    const handleSaveAndLog = async () => {
      const saved = await saveMeal();
      if (!saved) return;
      setBusy(true);
      try {
        const result = await logSavedMeal(saved.id);
        onLogged(result);
        dismiss();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to log meal.");
      } finally {
        setBusy(false);
      }
    };

    return (
      <BottomSheetModal
        ref={ref}
        maxDynamicContentSize={windowHeight * 0.85}
        backgroundStyle={{ backgroundColor: "#16180F" }}
        handleIndicatorStyle={{ backgroundColor: "#2A2D1E" }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.55} />
        )}
      >
        <View className="flex-row items-center justify-between border-b border-border-subtle px-5 pb-3.5">
          <Text className="font-display text-base text-text-primary">
            {target?.mode === "edit" ? "Edit Saved Meal" : "New Saved Meal"}
          </Text>
          <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close">
            <X size={18} color="#8E9085" />
          </Pressable>
        </View>

        <BottomSheetScrollView contentContainerClassName="gap-3 px-5 py-4">
          <View className="gap-1.5">
            <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-text-muted">Meal Name</Text>
            <BottomSheetTextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Breakfast Omelette"
              placeholderTextColor="#6E7066"
              className="rounded-sm border border-border-subtle bg-bg px-3.5 py-2.5 font-sans text-sm text-text-primary"
            />
          </View>

          <View className="gap-2">
            <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-text-muted">Ingredients</Text>

            {ingredients.map((ing, idx) => (
              <View
                key={`${ing.name}-${idx}`}
                className="flex-row items-center justify-between rounded-md border border-border-subtle bg-surface-inset px-3 py-2.5"
              >
                <Text className="flex-1 font-sans text-[13px] text-text-primary" numberOfLines={1}>
                  {ing.name}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="font-mono text-xs text-text-secondary">{Math.round(ing.weight_g)}g</Text>
                  <Pressable
                    onPress={() => handleRemoveIngredient(idx)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${ing.name}`}
                    hitSlop={8}
                  >
                    <X size={14} color="#6E7066" />
                  </Pressable>
                </View>
              </View>
            ))}

            <View className="gap-2 rounded-md border border-dashed border-border p-2.5">
              <View className="flex-row gap-2">
                <BottomSheetTextInput
                  value={newIngName}
                  onChangeText={setNewIngName}
                  placeholder="Ingredient name"
                  placeholderTextColor="#6E7066"
                  className="flex-[1.4] rounded-sm border border-border-subtle bg-bg px-3 py-2 font-sans text-xs text-text-primary"
                />
                <BottomSheetTextInput
                  value={newIngBrand}
                  onChangeText={setNewIngBrand}
                  placeholder="Brand"
                  placeholderTextColor="#6E7066"
                  className="flex-1 rounded-sm border border-border-subtle bg-bg px-3 py-2 font-sans text-xs text-text-primary"
                />
              </View>
              <View className="flex-row items-center gap-2">
                <BottomSheetTextInput
                  value={newIngWeight}
                  onChangeText={setNewIngWeight}
                  keyboardType="numeric"
                  className="flex-1 rounded-sm border border-border-subtle bg-bg px-3 py-2 text-center font-mono text-xs text-text-primary"
                />
                <Text className="font-sans text-[11px] text-text-muted">g</Text>
                <Pressable
                  onPress={handleAddIngredient}
                  disabled={resolving || !newIngName.trim()}
                  className={`flex-row items-center gap-1 rounded-full border border-border bg-surface-high px-3.5 py-2 ${
                    resolving || !newIngName.trim() ? "opacity-50" : ""
                  }`}
                >
                  <Plus size={12} color="#C9F24D" />
                  <Text className="font-sans-bold text-[11px] text-accent">{resolving ? "Adding…" : "Add"}</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="gap-1.5 rounded-md border border-border-subtle bg-surface-inset p-3.5">
            <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-text-muted">Total macros</Text>
            <View className="flex-row justify-between">
              <Text className="font-mono text-[13px] font-bold text-macro-calories">{Math.round(totals.calories)} kcal</Text>
              <Text className="font-mono text-xs text-macro-protein">{Math.round(totals.protein)}g P</Text>
              <Text className="font-mono text-xs text-macro-carbs">{Math.round(totals.carbs)}g C</Text>
              <Text className="font-mono text-xs text-macro-fat">{Math.round(totals.fat)}g F</Text>
            </View>
          </View>

          {error ? <Banner variant="error" message={error} /> : null}
        </BottomSheetScrollView>

        <View className="flex-row gap-2.5 border-t border-border-subtle px-5 py-4">
          <Pressable
            onPress={handleSaveMeal}
            disabled={busy}
            className={`flex-1 items-center rounded-full border border-border bg-surface-high py-3 ${busy ? "opacity-50" : ""}`}
          >
            <Text className="font-sans-semibold text-[13px] text-text-secondary">Save Meal</Text>
          </Pressable>
          <Pressable
            onPress={handleSaveAndLog}
            disabled={busy}
            className={`flex-1 items-center rounded-full bg-accent py-3 ${busy ? "opacity-50" : ""}`}
          >
            <Text className="font-sans-bold text-[13px] text-bg">Save & Log Now</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    );
  }
);
