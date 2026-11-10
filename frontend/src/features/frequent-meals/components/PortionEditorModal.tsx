"use client";

import { useState } from "react";
import { SlidersHorizontal, Zap } from "lucide-react";
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
  const estimate = roundMacros(sumIngredientMacros(meal.ingredients, (ing) => gramsFor(ing.name || "", ing.weight_g)));

  return (
    <Modal
      size="md"
      title="Adjust portions"
      icon={<SlidersHorizontal />}
      subtitle={meal.display_name}
      onClose={onClose}
      bodyClassName="space-y-3"
    >
      {meal.ingredients.map((ing) => {
        const name = ing.name || "";
        return (
          <div key={name} className="flex items-center gap-3 border-b border-line pb-3">
            <span className="flex-1 font-display text-sm font-medium capitalize text-ink">{name}</span>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                size="sm"
                aria-label={`${name} grams`}
                className="w-20 text-right font-mono"
                value={gramsFor(name, ing.weight_g)}
                onChange={(e) => setGrams((prev) => ({ ...prev, [name]: Number(e.target.value) }))}
              />
              <span className="w-4 font-mono text-xs text-ink-muted">g</span>
            </div>
          </div>
        );
      })}

      <div className="border border-line bg-surface-low p-3">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
          Estimated macros with these portions
        </p>
        <MacroInline macros={estimate} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" icon={<Zap />} loading={logging} loadingText="Logging..." onClick={() => onConfirm(grams)}>
          Log portions
        </Button>
      </div>
    </Modal>
  );
}
