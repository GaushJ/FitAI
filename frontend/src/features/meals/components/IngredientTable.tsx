import { Pencil } from "lucide-react";
import { IconButton } from "@/components/atoms/IconButton";
import { IngredientLabel } from "@/components/molecules/IngredientLabel";
import { cn } from "@/lib/cn";
import { MACRO_TEXT } from "@/lib/macroStyles";
import { macroActual } from "@/lib/nutrition";
import type { Ingredient, Macros } from "@/types/nutrition";

const GRID = "grid gap-x-3 grid-cols-[1fr_auto_auto_auto_auto_auto]";
const GRID_EDITABLE = "grid gap-x-3 grid-cols-[1fr_auto_auto_auto_auto_auto_auto]";

interface IngredientTableProps {
  ingredients: Ingredient[];
  /** Adds a summary row. */
  total?: Macros;
  /** Adds a per-row edit button. */
  onEdit?: (index: number, ingredient: Ingredient) => void;
}

/** Wide-screen ingredient breakdown: one column per macro. */
export function IngredientTable({ ingredients, total, onEdit }: IngredientTableProps) {
  const grid = onEdit ? GRID_EDITABLE : GRID;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          grid,
          "border-b border-slate-900 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-600",
        )}
      >
        <span>Ingredient</span>
        <span className="text-right">Weight</span>
        <span className="text-right text-orange-500">kcal</span>
        <span className={cn("text-right", MACRO_TEXT.protein)}>Protein</span>
        <span className={cn("text-right", MACRO_TEXT.carbs)}>Carbs</span>
        <span className={cn("text-right", MACRO_TEXT.fat)}>Fat</span>
        {onEdit && <span />}
      </div>

      {ingredients.map((ing, index) => (
        <div key={index} className={cn(grid, "items-center py-1 text-xs")}>
          <IngredientLabel name={ing.name} brand={ing.brand} truncate />
          <span className="text-right font-mono text-[10px] text-slate-500">{ing.weight_g}g</span>
          <span className="text-right font-mono text-[10px] font-semibold text-orange-300">
            {macroActual(ing.calories_per_100g, ing.weight_g)}
          </span>
          <span className="text-right font-mono text-[10px] text-accent-light">
            {macroActual(ing.protein_per_100g, ing.weight_g)}g
          </span>
          <span className="text-right font-mono text-[10px] text-cyan-300">
            {macroActual(ing.carbs_per_100g, ing.weight_g)}g
          </span>
          <span className="text-right font-mono text-[10px] text-rose-300">
            {macroActual(ing.fat_per_100g, ing.weight_g)}g
          </span>
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
      ))}

      {total && (
        <div
          className={cn(grid, "mt-1 items-center border-t border-slate-900 pt-2 font-mono text-[10px] font-bold")}
        >
          <span className="font-sans uppercase tracking-wider text-slate-400">Total</span>
          <span />
          <span className={cn("text-right", MACRO_TEXT.calories)}>{Math.round(total.calories)}</span>
          <span className={cn("text-right", MACRO_TEXT.protein)}>{total.protein}g</span>
          <span className={cn("text-right", MACRO_TEXT.carbs)}>{total.carbs}g</span>
          <span className={cn("text-right", MACRO_TEXT.fat)}>{total.fat}g</span>
          {onEdit && <span />}
        </div>
      )}
    </div>
  );
}
