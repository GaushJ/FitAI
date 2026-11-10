import { Pencil } from "lucide-react";
import { IconButton } from "@/components/atoms/IconButton";
import { IngredientLabel } from "@/components/molecules/IngredientLabel";
import { MacroInline } from "@/components/molecules/MacroInline";
import { macroActual } from "@/lib/nutrition";
import type { Ingredient, Macros } from "@/types/nutrition";

interface IngredientCardListProps {
  ingredients: Ingredient[];
  total?: Macros;
  onEdit?: (index: number, ingredient: Ingredient) => void;
}

const actualMacros = (ing: Ingredient): Macros => ({
  calories: macroActual(ing.calories_per_100g, ing.weight_g),
  protein: macroActual(ing.protein_per_100g, ing.weight_g),
  carbs: macroActual(ing.carbs_per_100g, ing.weight_g),
  fat: macroActual(ing.fat_per_100g, ing.weight_g),
});

/**
 * Phone-width ingredient breakdown. Six columns can't fit, so each ingredient
 * gets a name + weight line and a wrapping row of labelled macros instead.
 */
export function IngredientCardList({ ingredients, total, onEdit }: IngredientCardListProps) {
  return (
    <div className="space-y-3">
      {ingredients.map((ing, index) => (
        <div key={index} className="space-y-1 border-b border-line pb-3 last:border-b-0">
          <div className="flex items-start justify-between gap-2">
            <IngredientLabel name={ing.name} brand={ing.brand} />
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="font-mono text-[11px] text-ink-muted">{ing.weight_g}g</span>
              {onEdit && (
                <IconButton label="Edit this ingredient's macros" size="xs" onClick={() => onEdit(index, ing)}>
                  <Pencil />
                </IconButton>
              )}
            </div>
          </div>
          <MacroInline macros={actualMacros(ing)} size="sm" className="pl-3.5" />
        </div>
      ))}

      {total && (
        <div className="flex items-center justify-between gap-3 border-t-2 border-ink pt-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-ink">Total</span>
          <MacroInline macros={total} size="sm" className="justify-end font-medium" />
        </div>
      )}
    </div>
  );
}
