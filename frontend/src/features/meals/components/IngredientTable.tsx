import { Pencil } from "lucide-react";
import { IconButton } from "@/components/atoms/IconButton";
import { IngredientLabel } from "@/components/molecules/IngredientLabel";
import { cn } from "@/lib/cn";
import { MACRO_TEXT } from "@/lib/macroStyles";
import { macroActual } from "@/lib/nutrition";
import type { Ingredient, Macros } from "@/types/nutrition";

const GRID = "grid gap-x-4 grid-cols-[1fr_auto_auto_auto_auto_auto]";
const GRID_EDITABLE = "grid gap-x-4 grid-cols-[1fr_auto_auto_auto_auto_auto_auto]";

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
  const cell = "text-right font-mono text-xs";

  return (
    <div>
      <div className={cn(grid, "border-b border-line pb-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted")}>
        <span>Ingredient</span>
        <span className="text-right">Weight</span>
        <span className={cn("text-right", MACRO_TEXT.calories)}>kcal</span>
        <span className="text-right">Protein</span>
        <span className="text-right">Carbs</span>
        <span className="text-right">Fat</span>
        {onEdit && <span />}
      </div>

      {ingredients.map((ing, index) => (
        <div key={index} className={cn(grid, "items-center border-b border-line py-2.5 last:border-b-0")}>
          <IngredientLabel name={ing.name} brand={ing.brand} truncate />
          <span className={cn(cell, "text-ink-muted")}>{ing.weight_g}g</span>
          <span className={cn(cell, "font-medium", MACRO_TEXT.calories)}>
            {macroActual(ing.calories_per_100g, ing.weight_g)}
          </span>
          <span className={cn(cell, "text-ink")}>{macroActual(ing.protein_per_100g, ing.weight_g)}g</span>
          <span className={cn(cell, "text-ink")}>{macroActual(ing.carbs_per_100g, ing.weight_g)}g</span>
          <span className={cn(cell, "text-ink")}>{macroActual(ing.fat_per_100g, ing.weight_g)}g</span>
          {onEdit && (
            <IconButton label="Edit this ingredient's macros" size="xs" onClick={() => onEdit(index, ing)}>
              <Pencil />
            </IconButton>
          )}
        </div>
      ))}

      {total && (
        <div className={cn(grid, "mt-1 items-center border-t-2 border-ink pt-2.5 font-mono text-xs font-medium")}>
          <span className="uppercase tracking-widest text-ink">Total</span>
          <span />
          <span className={cn("text-right", MACRO_TEXT.calories)}>{Math.round(total.calories)}</span>
          <span className="text-right text-ink">{total.protein}g</span>
          <span className="text-right text-ink">{total.carbs}g</span>
          <span className="text-right text-ink">{total.fat}g</span>
          {onEdit && <span />}
        </div>
      )}
    </div>
  );
}
