import { Pressable, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors } from "@/theme/colors";

// Mirrors frontend/src/components/atoms/IconButton.tsx. Web's hover colours are shown while pressed.
type Variant = "neutral" | "danger" | "outline";
type Size = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<Variant, { box: string; pressedBox: string; icon: string; pressedIcon: string }> = {
  neutral: { box: "", pressedBox: "bg-surface-container", icon: colors.inkMuted, pressedIcon: colors.ink },
  danger: { box: "", pressedBox: "bg-danger-soft", icon: colors.inkMuted, pressedIcon: colors.danger },
  outline: { box: "border border-line bg-card", pressedBox: "border border-ink bg-card", icon: colors.inkMuted, pressedIcon: colors.ink },
};

const SIZES: Record<Size, { box: string; icon: number }> = {
  xs: { box: "h-6 w-6", icon: 12 },
  sm: { box: "h-7 w-7", icon: 14 },
  md: { box: "h-8 w-8", icon: 16 },
  lg: { box: "h-10 w-10", icon: 20 },
};

interface IconButtonProps {
  /** Accessible name. */
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
}

export function IconButton({ label, icon: Icon, onPress, variant = "neutral", size = "md", disabled, className = "" }: IconButtonProps) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      className={`${disabled ? "opacity-40" : ""} ${className}`}
    >
      {({ pressed }) => (
        <View className={`items-center justify-center rounded-xs ${s.box} ${pressed ? v.pressedBox : v.box}`}>
          <Icon size={s.icon} color={pressed ? v.pressedIcon : v.icon} />
        </View>
      )}
    </Pressable>
  );
}
