import { View, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors } from "@/theme/colors";

// Mirrors frontend/src/components/atoms/Badge.tsx.
type Tone = "dark" | "primary" | "muted" | "success" | "warning";

const TONES: Record<Tone, { box: string; text: string; icon: string }> = {
  dark: { box: "bg-ink", text: "text-white", icon: colors.white },
  primary: { box: "bg-primary", text: "text-white", icon: colors.white },
  muted: { box: "bg-surface-container", text: "text-ink-muted", icon: colors.inkMuted },
  success: { box: "border border-success/40 bg-success-soft", text: "text-success", icon: colors.success },
  warning: { box: "border border-warning/40 bg-warning-soft", text: "text-warning", icon: colors.warning },
};

interface BadgeProps {
  tone?: Tone;
  icon?: LucideIcon;
  children: string;
}

/** Small uppercase mono tag, e.g. "10 SAVED" or "SET". */
export function Badge({ tone = "dark", icon: Icon, children }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View className={`flex-row items-center gap-1 self-start rounded-xs px-1.5 py-0.5 ${t.box}`}>
      {Icon ? <Icon size={12} color={t.icon} /> : null}
      <Text className={`font-mono-medium text-[10px] uppercase tracking-wider ${t.text}`}>{children}</Text>
    </View>
  );
}
