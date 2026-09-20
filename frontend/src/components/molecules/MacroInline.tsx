import { cn } from "@/lib/cn";
import { MACRO_TEXT } from "@/lib/macroStyles";
import type { Macros } from "@/types/nutrition";

interface MacroInlineProps {
  macros: Macros;
  size?: "sm" | "md";
  showCalories?: boolean;
  className?: string;
}

/** "420 kcal  P 30g  C 40g  F 10g", each part in its macro colour. */
export function MacroInline({ macros, size = "md", showCalories = true, className }: MacroInlineProps) {
  return (
    <div
      className={cn("flex font-mono", size === "sm" ? "gap-2 text-[9px]" : "gap-3 text-[10px]", className)}
    >
      {showCalories && <span className={MACRO_TEXT.calories}>{Math.round(macros.calories)} kcal</span>}
      <span className={MACRO_TEXT.protein}>P {macros.protein}g</span>
      <span className={MACRO_TEXT.carbs}>C {macros.carbs}g</span>
      <span className={MACRO_TEXT.fat}>F {macros.fat}g</span>
    </div>
  );
}
