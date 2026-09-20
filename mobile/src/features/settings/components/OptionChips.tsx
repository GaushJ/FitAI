import { View, Text, Pressable } from "react-native";

interface OptionChipsProps<T extends string> {
  label: string;
  options: Array<{ value: T; label: string; hint?: string }>;
  value: T | "";
  onChange: (value: T) => void;
}

/** Single-choice picker rendered as wrapping pills, with the chosen option's hint underneath.
 * Used instead of a native dropdown, which the bottom sheet handles poorly. */
export function OptionChips<T extends string>({ label, options, value, onChange }: OptionChipsProps<T>) {
  const selected = options.find((o) => o.value === value);
  return (
    <View className="gap-1.5">
      <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-text-muted">{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => onChange(option.value)}
              className={`rounded-full border px-3.5 py-2 ${active ? "border-accent bg-accent" : "border-border bg-surface-high"}`}
            >
              <Text className={`font-sans-semibold text-xs ${active ? "text-bg" : "text-text-secondary"}`}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {selected?.hint ? <Text className="font-sans text-[10px] text-text-muted">{selected.hint}</Text> : null}
    </View>
  );
}
