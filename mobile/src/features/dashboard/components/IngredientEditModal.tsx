import { useState } from "react";
import { Text, View } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Check, Pencil } from "lucide-react-native";
import { Button, FormField, InlineNotice, Input, MacroInline, Modal } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { MACRO_TEXT } from "@/lib/macroStyles";
import { macroActual } from "@/lib/nutrition";
import type { Notice } from "@/types/notice";
import { updateMealIngredient } from "../api";
import type { IngredientEditTarget } from "./TodayMeals";

// Port of web's IngredientEditModal + useIngredientEditForm.
interface IngredientEditForm {
  weight_g: string;
  calories_per_100g: string;
  protein_per_100g: string;
  carbs_per_100g: string;
  fat_per_100g: string;
}

const MACRO_FIELDS: { key: keyof IngredientEditForm; label: string; tone: string }[] = [
  { key: "calories_per_100g", label: "Kcal / 100g", tone: MACRO_TEXT.calories },
  { key: "protein_per_100g", label: "Protein / 100g", tone: MACRO_TEXT.protein },
  { key: "carbs_per_100g", label: "Carbs / 100g", tone: MACRO_TEXT.carbs },
  { key: "fat_per_100g", label: "Fat / 100g", tone: MACRO_TEXT.fat },
];

const toNumber = (value: string) => Number(value) || 0;

interface IngredientEditModalProps {
  target: IngredientEditTarget;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

/** Corrects one logged ingredient's weight / macros and previews the resulting totals. */
export function IngredientEditModal({ target, onClose, onSaved }: IngredientEditModalProps) {
  const { ingredient } = target;
  const [form, setForm] = useState<IngredientEditForm>({
    weight_g: String(ingredient.weight_g ?? ""),
    calories_per_100g: String(ingredient.calories_per_100g ?? ""),
    protein_per_100g: String(ingredient.protein_per_100g ?? ""),
    carbs_per_100g: String(ingredient.carbs_per_100g ?? ""),
    fat_per_100g: String(ingredient.fat_per_100g ?? ""),
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const setField = (key: keyof IngredientEditForm, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const weight = toNumber(form.weight_g);
  const resulting = {
    calories: macroActual(toNumber(form.calories_per_100g), weight),
    protein: macroActual(toNumber(form.protein_per_100g), weight),
    carbs: macroActual(toNumber(form.carbs_per_100g), weight),
    fat: macroActual(toNumber(form.fat_per_100g), weight),
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await updateMealIngredient(target.mealId, target.index, {
        weight_g: weight,
        calories_per_100g: toNumber(form.calories_per_100g),
        protein_per_100g: toNumber(form.protein_per_100g),
        carbs_per_100g: toNumber(form.carbs_per_100g),
        fat_per_100g: toNumber(form.fat_per_100g),
      });
      await onSaved();
    } catch (err) {
      setNotice({ tone: "error", text: getErrorMessage(err, "Failed to update ingredient.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit ingredient" icon={Pencil} subtitle={ingredient.name} onClose={onClose}>
      <FormField label="Weight (g)">
        <Input keyboardType="numeric" value={form.weight_g} onChangeText={(v) => setField("weight_g", v)} InputComponent={BottomSheetTextInput} />
      </FormField>

      <View className="flex-row flex-wrap gap-3">
        {MACRO_FIELDS.map(({ key, label, tone }) => (
          <FormField key={key} label={label} labelClassName={tone} className="w-[47%]">
            <Input keyboardType="numeric" value={form[key]} onChangeText={(v) => setField(key, v)} InputComponent={BottomSheetTextInput} />
          </FormField>
        ))}
      </View>

      <View className="border border-line bg-surface-low p-3">
        <Text className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted">Resulting macros for this ingredient</Text>
        <MacroInline macros={resulting} />
      </View>

      {notice ? <InlineNotice notice={notice} /> : null}

      <View className="flex-row gap-3 pt-1">
        <View className="flex-1">
          <Button variant="outline" fullWidth onPress={onClose}>
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button fullWidth icon={Check} loading={saving} loadingText="Saving..." onPress={save}>
            Save
          </Button>
        </View>
      </View>
    </Modal>
  );
}
