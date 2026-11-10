import { Text, View } from "react-native";
import { MACRO_TEXT } from "@/lib/macroStyles";
import type { Macros } from "@/types/nutrition";

// Mirrors frontend/src/components/molecules/MacroInline.tsx.
interface MacroInlineProps {
  macros: Macros;
  size?: "sm" | "md";
  showCalories?: boolean;
  className?: string;
}

/** "420 kcal · P 30g · C 40g · F 10g", each part in its macro colour. */
export function MacroInline({ macros, size = "md", showCalories = true, className = "" }: MacroInlineProps) {
  const text = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <View className={`flex-row flex-wrap ${size === "sm" ? "gap-x-2" : "gap-x-3"} ${className}`}>
      {showCalories ? (
        <Text className={`font-mono-medium ${text} ${MACRO_TEXT.calories}`}>{Math.round(macros.calories)} kcal</Text>
      ) : null}
      <Text className={`font-mono ${text} ${MACRO_TEXT.protein}`}>P {macros.protein}g</Text>
      <Text className={`font-mono ${text} ${MACRO_TEXT.carbs}`}>C {macros.carbs}g</Text>
      <Text className={`font-mono ${text} ${MACRO_TEXT.fat}`}>F {macros.fat}g</Text>
    </View>
  );
}
