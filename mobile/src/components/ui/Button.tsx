import { Pressable, Text, type PressableProps } from "react-native";

type ButtonVariant = "primary" | "secondary" | "destructive";

interface ButtonProps extends Omit<PressableProps, "children"> {
  children: string;
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent active:bg-accent-hover",
  secondary: "bg-surface-high border border-border",
  destructive: "bg-transparent active:bg-danger-bg",
};

const VARIANT_TEXT_CLASSES: Record<ButtonVariant, string> = {
  primary: "text-bg font-sans-bold",
  secondary: "text-text-secondary font-sans-semibold",
  destructive: "text-danger font-sans-semibold",
};

export function Button({ children, variant = "primary", className = "", disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      className={`rounded-full px-5 py-3 ${VARIANT_CLASSES[variant]} ${disabled ? "opacity-40" : ""} ${className}`}
      {...rest}
    >
      <Text className={`text-center text-sm ${VARIANT_TEXT_CLASSES[variant]}`}>{children}</Text>
    </Pressable>
  );
}
