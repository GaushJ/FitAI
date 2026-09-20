import { Pencil } from "lucide-react";
import { IconButton } from "@/components/atoms/IconButton";
import { IngredientLabel } from "@/components/molecules/IngredientLabel";
import { MACRO_TEXT } from "@/lib/macroStyles";
import { macroActual } from "@/lib/nutrition";
import type { Ingredient, Macros } from "@/types/nutrition";

interface IngredientCardListProps {
  ingredients: Ingredient[];
  total?: Macros;
  onEdit?: (index: number, ingredient: Ingredient) => void;
}

/**
 * Phone-width ingredient breakdown. Six columns can't fit, so each ingredient
 * gets a name + weight line and a wrapping row of labelled macros instead.
 */
export function IngredientCardList({ ingredients, total, onEdit }: IngredientCardListProps) {
  return (
    <div className="space-y-3">
      {ingredients.map((ing, index) => (
        <div key={index} className="space-y-1 border-b border-slate-900/80 pb-2 last:border-b-0 last:pb-0">
          <div className="flex items-start justify-between gap-2">
            <IngredientLabel name={ing.name} brand={ing.brand} />
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="pt-0.5 font-mono text-[10px] text-slate-500">{ing.weight_g}g</span>
              {onEdit && (
                <IconButton
                  label="Edit this ingredient's macros"
                  size="xs"
                  variant="outline-accent"
                  onClick={() => onEdit(index, ing)}
                >
                  <Pencil />
                </IconButton>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 pl-3 font-mono text-[10px]">
            <span className="font-semibold text-orange-300">
              {macroActual(ing.calories_per_100g, ing.weight_g)} kcal
            </span>
            <span className="text-accent-light">P {macroActual(ing.protein_per_100g, ing.weight_g)}g</span>
            <span className="text-cyan-300">C {macroActual(ing.carbs_per_100g, ing.weight_g)}g</span>
            <span className="text-rose-300">F {macroActual(ing.fat_per_100g, ing.weight_g)}g</span>
          </div>
        </div>
      ))}

      {total && (
        <div className="mt-1 flex items-center justify-between border-t border-slate-900 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-0.5 font-mono text-[10px] font-bold">
            <span className={MACRO_TEXT.calories}>{Math.round(total.calories)} kcal</span>
            <span className={MACRO_TEXT.protein}>P {total.protein}g</span>
            <span className={MACRO_TEXT.carbs}>C {total.carbs}g</span>
            <span className={MACRO_TEXT.fat}>F {total.fat}g</span>
          </div>
        </div>
      )}
    </div>
  );
}
