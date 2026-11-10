import { Text, View } from "react-native";
import { Tag } from "lucide-react-native";
import { colors } from "@/theme/colors";

// Mirrors frontend/src/components/molecules/IngredientLabel.tsx.
interface IngredientLabelProps {
  name: string;
  brand: string | null;
  /** Show the leading square bullet (used in tables/lists, not in editors). */
  bullet?: boolean;
}

export function IngredientLabel({ name, brand, bullet = true }: IngredientLabelProps) {
  return (
    <View className="min-w-0 flex-shrink flex-row flex-wrap items-center gap-2">
      {bullet ? <View className="h-1.5 w-1.5 bg-primary" /> : null}
      <Text className="font-display-medium text-sm capitalize text-ink">{name}</Text>
      {brand ? (
        <View className="flex-row items-center gap-1 border border-line bg-surface-low px-1.5 py-px">
          <Tag size={10} color={colors.inkMuted} />
          <Text className="font-mono text-[10px] text-ink-muted">{brand}</Text>
        </View>
      ) : null}
    </View>
  );
}
