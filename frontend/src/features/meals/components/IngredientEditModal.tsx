"use client";

import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { InlineNotice } from "@/components/atoms/InlineNotice";
import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { MacroInline } from "@/components/molecules/MacroInline";
import { Modal } from "@/components/organisms/Modal";
import { MACRO_TEXT } from "@/lib/macroStyles";
import { useIngredientEditForm } from "@/features/meals/hooks/useIngredientEditForm";
import type { IngredientEditForm, IngredientEditTarget } from "@/features/meals/types";

const MACRO_FIELDS: Array<{ key: keyof IngredientEditForm; label: string; tone: string }> = [
  { key: "calories_per_100g", label: "Kcal / 100g", tone: MACRO_TEXT.calories },
  { key: "protein_per_100g", label: "Protein / 100g", tone: MACRO_TEXT.protein },
  { key: "carbs_per_100g", label: "Carbs / 100g", tone: MACRO_TEXT.carbs },
  { key: "fat_per_100g", label: "Fat / 100g", tone: MACRO_TEXT.fat },
];

interface IngredientEditModalProps {
  target: IngredientEditTarget;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

/** Corrects one logged ingredient's weight / macros and previews the resulting totals. */
export function IngredientEditModal({ target, onClose, onSaved }: IngredientEditModalProps) {
  const { form, setField, resulting, saving, notice, save } = useIngredientEditForm(target, onSaved);

  return (
    <Modal
      compact
      size="sm"
      title="Edit Ingredient"
      icon={<Pencil className="text-accent" />}
      subtitle={<span className="capitalize">{target.ingredient.name}</span>}
      onClose={onClose}
      bodyClassName="space-y-3"
    >
      <FormField label="Weight (g)" variant="caps" labelClassName="text-slate-400">
        <Input
          type="number"
          min={0}
          value={form.weight_g}
          onChange={(e) => setField("weight_g", e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        {MACRO_FIELDS.map(({ key, label, tone }) => (
          <FormField key={key} label={label} labelClassName={tone}>
            <Input
              type="number"
              min={0}
              value={form[key]}
              onChange={(e) => setField(key, e.target.value)}
            />
          </FormField>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-600">
          Resulting macros for this ingredient
        </p>
        <MacroInline macros={resulting} />
      </div>

      {notice && <InlineNotice notice={notice} />}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={save}
          loading={saving}
          loadingText="Saving..."
          icon={<Check />}
        >
          Save Changes
        </Button>
      </div>
    </Modal>
  );
}
