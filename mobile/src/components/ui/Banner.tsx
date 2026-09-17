import { View, Text } from "react-native";
import { AlertCircle, CheckCircle2 } from "lucide-react-native";

interface BannerProps {
  message: string;
  variant: "error" | "success";
}

const VARIANT = {
  error: {
    container: "border-danger/20 bg-danger-bg",
    text: "text-danger",
    Icon: AlertCircle,
    iconColor: "#f87171",
  },
  success: {
    container: "border-success/20 bg-success-bg",
    text: "text-success",
    Icon: CheckCircle2,
    iconColor: "#34d399",
  },
} as const;

export function Banner({ message, variant }: BannerProps) {
  const { container, text, Icon, iconColor } = VARIANT[variant];
  return (
    <View className={`flex-row items-start gap-2 rounded-sm border p-3 ${container}`}>
      <Icon size={16} color={iconColor} style={{ marginTop: 1 }} />
      <Text className={`flex-1 font-sans text-xs ${text}`}>{message}</Text>
    </View>
  );
}
