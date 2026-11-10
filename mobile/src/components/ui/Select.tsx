import { useState } from "react";
import { Modal as RNModal, Pressable, ScrollView, Text, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { colors, shadows } from "@/theme/colors";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T | "";
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** Shown while nothing is chosen (web's disabled first `<option>`). */
  placeholder?: string;
  accessibilityLabel?: string;
}

/** Web's native `<select>` (atoms/Select): an Input-styled field with a chevron that opens the option list. */
export function Select<T extends string>({ value, options, onChange, placeholder = "", accessibilityLabel }: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className="flex-row items-center justify-between rounded-xs border border-line-strong bg-surface-low py-2.5 pl-3 pr-3"
      >
        <Text className={`flex-1 font-sans text-sm ${current ? "text-ink" : "text-ink-subtle"}`} numberOfLines={1}>
          {current?.label ?? placeholder}
        </Text>
        <ChevronDown size={16} color={colors.inkMuted} />
      </Pressable>

      <RNModal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-center bg-ink/50 p-4" onPress={() => setOpen(false)} accessibilityLabel="Close">
          <View className="max-h-[70%] border border-ink bg-card" style={shadows.hard}>
            <ScrollView>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex-row items-center justify-between border-b border-line px-4 py-3.5 ${active ? "bg-surface-container" : ""}`}
                  >
                    <Text className={`font-sans text-sm ${active ? "font-sans-semibold text-ink" : "text-ink-muted"}`}>
                      {option.label}
                    </Text>
                    {active ? <Check size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </RNModal>
    </>
  );
}
