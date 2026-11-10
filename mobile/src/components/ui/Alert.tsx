import { Pressable, Text, View } from "react-native";
import { AlertCircle, Check, TriangleAlert, X } from "lucide-react-native";
import { colors } from "@/theme/colors";
import type { Notice } from "@/types/notice";

// Mirrors frontend/src/components/atoms/Alert.tsx.
const TONES = {
  error: { box: "border-danger bg-danger-soft", text: "text-danger", color: colors.danger, icon: AlertCircle },
  success: { box: "border-success bg-success-soft", text: "text-success", color: colors.success, icon: Check },
  warning: { box: "border-warning bg-warning-soft", text: "text-warning", color: colors.warning, icon: TriangleAlert },
} as const;

interface AlertProps {
  tone: Notice["tone"];
  /** "lg" is the full-width page banner, "md" a compact in-form message. */
  size?: "md" | "lg";
  onDismiss?: () => void;
  children: string;
}

export function Alert({ tone, size = "md", onDismiss, children }: AlertProps) {
  const { box, text, color, icon: Icon } = TONES[tone];
  const isBanner = size === "lg";

  return (
    <View
      accessibilityRole={tone === "success" ? "summary" : "alert"}
      className={`flex-row gap-2.5 rounded-xs border-l-4 ${box} ${isBanner ? "items-center p-4" : "items-start p-3"}`}
    >
      <Icon size={isBanner ? 20 : 16} color={color} style={isBanner ? undefined : { marginTop: 1 }} />
      <Text className={`flex-1 font-sans-medium ${isBanner ? "text-sm" : "text-xs"} ${text}`}>{children}</Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8} className="opacity-70">
          <X size={16} color={color} />
        </Pressable>
      ) : null}
    </View>
  );
}
