import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors, pressed, shadows } from "@/theme/colors";

// Mirrors frontend/src/components/atoms/Button.tsx.
type Variant = "primary" | "dark" | "outline" | "ghost";
type Size = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<Variant, { box: string; text: string; icon: string }> = {
  primary: { box: "bg-primary", text: "text-white", icon: colors.white },
  dark: { box: "bg-ink", text: "text-white", icon: colors.white },
  outline: { box: "border border-ink bg-card", text: "text-ink", icon: colors.ink },
  ghost: { box: "", text: "text-ink-muted", icon: colors.inkMuted },
};

const SIZES: Record<Size, { box: string; text: string; icon: number }> = {
  xs: { box: "gap-1 px-2.5 py-1.5", text: "text-[11px]", icon: 12 },
  sm: { box: "gap-1.5 px-3 py-2", text: "text-xs", icon: 14 },
  md: { box: "gap-2 px-4 py-2.5", text: "text-sm", icon: 16 },
  lg: { box: "gap-2 px-5 py-3.5", text: "text-base", icon: 20 },
};

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  children: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Leading icon shown when not loading. */
  icon?: LucideIcon;
  /** Put the icon after the label (web's `flex-row-reverse`, e.g. "Sign in →"). */
  iconAfter?: boolean;
  /** Overrides the icon colour, e.g. the red calculator on an outline button. */
  iconColor?: string;
  /** Overrides the label colour, e.g. web's `text-primary` ghost "New" button. */
  textClassName?: string;
  /** Swaps the icon for a spinner and disables the button. */
  loading?: boolean;
  /** Replaces the label while loading. When omitted the label is kept. */
  loadingText?: string;
  /** Web's calculate button: `border-2 shadow-hard press-depth-4`. */
  raised?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  icon: Icon,
  iconAfter,
  iconColor,
  textClassName,
  loading,
  loadingText,
  raised,
  disabled,
  className = "",
  ...rest
}: ButtonProps) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const isDisabled = disabled || loading;
  const shadow = variant === "primary" ? shadows.hardPrimary : raised ? shadows.hard : undefined;
  const depth = variant === "primary" ? 3 : 4;

  const glyph = loading ? (
    <ActivityIndicator size="small" color={v.icon} />
  ) : Icon ? (
    <Icon size={s.icon} color={iconColor ?? v.icon} />
  ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`items-center justify-center rounded-xs ${v.box} ${raised ? "border-2" : ""} ${fullWidth ? "w-full" : ""} ${
        isDisabled ? "opacity-40" : ""
      } ${className}`}
      style={({ pressed: isPressed }) =>
        shadow ? (isPressed ? pressed(depth) : shadow) : isPressed ? { opacity: 0.85 } : undefined
      }
      {...rest}
    >
      <View className={`flex-row items-center justify-center ${s.box}`}>
        {!iconAfter ? glyph : null}
        <Text className={`font-display-semibold uppercase tracking-wide ${s.text} ${textClassName ?? v.text}`}>
          {loading && loadingText !== undefined ? loadingText : children}
        </Text>
        {iconAfter ? glyph : null}
      </View>
    </Pressable>
  );
}
