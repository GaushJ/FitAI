import { IngredientCardList } from "@/features/meals/components/IngredientCardList";
import { IngredientTable } from "@/features/meals/components/IngredientTable";
import type { Ingredient, Macros } from "@/types/nutrition";

interface IngredientBreakdownProps {
  ingredients: Ingredient[];
  total?: Macros;
  onEditIngredient?: (index: number, ingredient: Ingredient) => void;
}

/** Table on wide screens, stacked cards on phones. */
export function IngredientBreakdown({ ingredients, total, onEditIngredient }: IngredientBreakdownProps) {
  return (
    <>
      <div className="hidden sm:block">
        <IngredientTable ingredients={ingredients} total={total} onEdit={onEditIngredient} />
      </div>
      <div className="sm:hidden">
        <IngredientCardList ingredients={ingredients} total={total} onEdit={onEditIngredient} />
      </div>
    </>
  );
}
