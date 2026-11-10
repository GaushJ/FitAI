import { X } from "lucide-react";
import { IconButton } from "@/components/atoms/IconButton";
import { Input } from "@/components/atoms/Input";
import { IngredientLabel } from "@/components/molecules/IngredientLabel";
import { macroActual } from "@/lib/nutrition";
import type { Ingredient } from "@/types/nutrition";

interface EditorIngredientRowProps {
  ingredient: Ingredient;
  onWeightChange: (grams: number) => void;
  onRemove: () => void;
}

export function EditorIngredientRow({ ingredient, onWeightChange, onRemove }: EditorIngredientRowProps) {
  return (
    <div className="flex items-center gap-2 border border-line bg-card px-3 py-2">
      <div className="min-w-0 flex-1">
        <IngredientLabel name={ingredient.name} brand={ingredient.brand} bullet={false} truncate />
        <span className="font-mono text-[11px] text-ink-muted">
          {Math.round(macroActual(ingredient.calories_per_100g, ingredient.weight_g))} kcal
        </span>
      </div>
      <Input
        type="number"
        min={1}
        size="sm"
        aria-label={`${ingredient.name} grams`}
        className="w-16 text-right font-mono"
        value={ingredient.weight_g}
        onChange={(e) => onWeightChange(Number(e.target.value))}
      />
      <span className="w-3 font-mono text-xs text-ink-muted">g</span>
      <IconButton label="Remove ingredient" variant="danger" size="sm" onClick={onRemove}>
        <X />
      </IconButton>
    </div>
  );
}
