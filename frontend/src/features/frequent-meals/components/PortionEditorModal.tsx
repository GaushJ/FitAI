"use client";

import { useState } from "react";
import { Sliders, Zap } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { MacroInline } from "@/components/molecules/MacroInline";
import { Modal } from "@/components/organisms/Modal";
import { roundMacros, sumIngredientMacros } from "@/lib/nutrition";
import type { FrequentMeal, PortionOverrides } from "@/features/frequent-meals/types";

const DEFAULT_GRAMS = 100;

interface PortionEditorModalProps {
  meal: FrequentMeal;
  logging: boolean;
  onClose: () => void;
  onConfirm: (portions: PortionOverrides) => void;
}

/** Lets the user tweak each ingredient's grams before quick-logging a frequent meal. */
export function PortionEditorModal({ meal, logging, onClose, onConfirm }: PortionEditorModalProps) {
  const [grams, setGrams] = useState<PortionOverrides>(() =>
    Object.fromEntries(
      meal.ingredients.filter((ing) => ing.name).map((ing) => [ing.name, ing.weight_g ?? DEFAULT_GRAMS]),
    ),
  );

  const gramsFor = (name: string, fallback: number) => grams[name] ?? fallback ?? DEFAULT_GRAMS;
  const estimate = roundMacros(
    sumIngredientMacros(meal.ingredients, (ing) => gramsFor(ing.name || "", ing.weight_g)),
  );

  return (
    <Modal
      compact
      size="md"
      title="Adjust Portions"
      icon={<Sliders className="text-accent" />}
      subtitle={meal.display_name}
      onClose={onClose}
      bodyClassName="space-y-3"
    >
      {meal.ingredients.map((ing) => {
        const name = ing.name || "";
        return (
          <div key={name} className="flex items-center gap-3">
            <span className="flex-1 text-xs font-medium capitalize text-slate-300">{name}</span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={1}
                size="sm"
                aria-label={`${name} grams`}
                className="w-20 text-right"
                value={gramsFor(name, ing.weight_g)}
                onChange={(e) => setGrams((prev) => ({ ...prev, [name]: Number(e.target.value) }))}
              />
              <span className="w-4 text-[10px] text-slate-500">g</span>
            </div>
          </div>
        );
      })}

      <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-600">
          Estimated macros with these portions
        </p>
        <MacroInline macros={estimate} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          icon={<Zap />}
          loading={logging}
          loadingText="Logging..."
          onClick={() => onConfirm(grams)}
        >
          Log with These Portions
        </Button>
      </div>
    </Modal>
  );
}
