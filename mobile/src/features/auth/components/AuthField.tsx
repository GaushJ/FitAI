import { useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from "react-native";
import { Eye, EyeOff, type LucideIcon } from "lucide-react-native";

interface AuthFieldProps {
  label: string;
  icon: LucideIcon;
  iconColor?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Renders a show/hide toggle and masks the value until revealed. */
  secureToggle?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  mono?: boolean;
  /** Overrides the border color, e.g. red when a confirm-password field mismatches. */
  borderColor?: string;
}

/** Icon-prefixed labeled input, shared by the login and signup forms. */
export function AuthField({
  label,
  icon: Icon,
  iconColor = "#8E9085",
  value,
  onChangeText,
  placeholder,
  secureToggle = false,
  keyboardType,
  autoCapitalize = "none",
  mono = false,
  borderColor,
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="gap-1.5">
      <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-text-muted">{label}</Text>
      <View className="relative justify-center">
        <View className="absolute left-3 z-10">
          <Icon size={14} color={iconColor} />
        </View>
        <TextInput
          className={`rounded-sm border bg-bg py-3 pl-9 text-sm text-text-primary ${
            secureToggle ? "pr-10" : "pr-3.5"
          } ${mono ? "font-mono" : "font-sans"}`}
          style={{ borderColor: borderColor ?? "rgba(255,255,255,0.09)" }}
          placeholder={placeholder}
          placeholderTextColor="#6E7066"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureToggle && !visible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setVisible((prev) => !prev)}
            className="absolute right-3"
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={14} color="#6E7066" /> : <Eye size={14} color="#6E7066" />}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
