import { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { Eye, EyeOff, Lock, type LucideIcon } from "lucide-react-native";
import { FormField } from "@/components/ui";
import { colors } from "@/theme/colors";

// Ports of web's AuthInput and PasswordField.

interface AuthInputProps extends TextInputProps {
  icon: LucideIcon;
  /** Element docked at the right edge (e.g. a show/hide toggle). */
  trailing?: React.ReactNode;
  invalid?: boolean;
  mono?: boolean;
}

/** Large text field with a leading icon, used on the login / signup screen. */
export function AuthInput({ icon: Icon, trailing, invalid, mono, onFocus, onBlur, ...rest }: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const border = invalid ? "border-danger" : focused ? "border-ink" : "border-line-strong";
  return (
    <View className="justify-center">
      <View className="absolute left-3.5 z-10" pointerEvents="none">
        <Icon size={16} color={colors.inkMuted} />
      </View>
      <TextInput
        autoCapitalize="none"
        placeholderTextColor={colors.inkSubtle}
        className={`rounded-xs border py-3 pl-10 text-base text-ink ${trailing ? "pr-11" : "pr-4"} ${border} ${
          focused ? "bg-card" : "bg-surface-low"
        } ${mono ? "font-mono" : "font-sans"}`}
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
      {trailing}
    </View>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Adds a show/hide toggle. */
  revealable?: boolean;
  invalid?: boolean;
}

export function PasswordField({ label, value, onChange, placeholder, revealable, invalid }: PasswordFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const Toggle = revealed ? EyeOff : Eye;

  return (
    <FormField label={label}>
      <AuthInput
        icon={Lock}
        secureTextEntry={!revealed}
        accessibilityLabel={label}
        placeholder={placeholder}
        value={value}
        invalid={invalid}
        onChangeText={onChange}
        trailing={
          revealable ? (
            <Pressable
              onPress={() => setRevealed((r) => !r)}
              accessibilityRole="button"
              accessibilityLabel={revealed ? "Hide password" : "Show password"}
              hitSlop={8}
              className="absolute right-3.5"
            >
              <Toggle size={16} color={colors.inkMuted} />
            </Pressable>
          ) : undefined
        }
      />
    </FormField>
  );
}
