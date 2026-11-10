import { Text, View } from "react-native";
import { Dumbbell } from "lucide-react-native";
import { colors, shadows } from "@/theme/colors";

// Mirrors frontend/src/components/molecules/BrandLogo.tsx.
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { mark: string; icon: number; text: string }> = {
  sm: { mark: "h-6 w-6", icon: 14, text: "text-lg" },
  md: { mark: "h-7 w-7", icon: 16, text: "text-2xl" },
  lg: { mark: "h-11 w-11", icon: 24, text: "text-4xl" },
};

/** Red dumbbell mark + "GETFITBRO" wordmark. */
export function BrandLogo({ size = "md" }: { size?: Size }) {
  const s = SIZES[size];
  return (
    <View className="flex-row items-center gap-2">
      <View className={`items-center justify-center bg-primary ${s.mark}`} style={shadows.hardSm}>
        <Dumbbell size={s.icon} color={colors.white} strokeWidth={2.4} style={{ transform: [{ rotate: "-45deg" }] }} />
      </View>
      <Text className={`font-display uppercase tracking-tight text-ink ${s.text}`}>GetFitBro</Text>
    </View>
  );
}
