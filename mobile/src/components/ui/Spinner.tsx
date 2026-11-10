import { ActivityIndicator, View } from "react-native";
import { colors } from "@/theme/colors";

/** Web's centred `<Spinner className="size-8 text-primary" />` loading state. */
export function Spinner({ color = colors.primary, className = "py-16" }: { color?: string; className?: string }) {
  return (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
}
