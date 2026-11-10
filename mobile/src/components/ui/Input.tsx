import { useState } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { colors } from "@/theme/colors";

// Mirrors frontend/src/components/atoms/Input.tsx.
type Size = "xs" | "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-3 py-2.5 text-sm",
  lg: "px-4 py-3 text-base",
};

export interface InputProps extends TextInputProps {
  size?: Size;
  invalid?: boolean;
  mono?: boolean;
  /** Bottom sheets pass BottomSheetTextInput so the keyboard doesn't fight the sheet's gestures. */
  InputComponent?: React.ComponentType<TextInputProps>;
}

export function Input({ size = "md", invalid, mono, InputComponent = TextInput, className = "", onFocus, onBlur, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const border = invalid ? "border-danger" : focused ? "border-ink" : "border-line-strong";
  return (
    <InputComponent
      placeholderTextColor={colors.inkSubtle}
      className={`w-full rounded-xs border text-ink ${focused ? "bg-card" : "bg-surface-low"} ${border} ${SIZES[size]} ${
        mono ? "font-mono" : "font-sans"
      } ${className}`}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...rest}
    />
  );
}
