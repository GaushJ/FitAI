import { Pressable, ScrollView, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors } from "@/theme/colors";

// Mirrors frontend/src/components/molecules/SegmentedTabs.tsx.
export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedTabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Stretch tabs to fill the row (forms) rather than size to content (toolbars, which then scroll sideways). */
  fullWidth?: boolean;
  /** "dark" fills the active tab with ink; "light" lifts it onto a white card. */
  tone?: "dark" | "light";
}

export function SegmentedTabs<T extends string>({ tabs, value, onChange, fullWidth = true, tone = "dark" }: SegmentedTabsProps<T>) {
  const row = (
    <View accessibilityRole="tablist" className={`flex-row gap-1 border border-line bg-surface-container p-1 ${fullWidth ? "" : "self-start"}`}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = id === value;
        const textClass = active ? (tone === "dark" ? "text-white" : "text-ink") : "text-ink-muted";
        const iconColor = active ? (tone === "dark" ? colors.white : colors.ink) : colors.inkMuted;
        return (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(id)}
            className={`flex-row items-center justify-center gap-2 px-4 py-2 ${fullWidth ? "flex-1" : ""} ${
              active ? (tone === "dark" ? "bg-ink" : "border border-line bg-card") : ""
            }`}
          >
            {Icon ? <Icon size={16} color={iconColor} /> : null}
            <Text className={`font-display-semibold text-sm uppercase tracking-wide ${textClass}`}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return fullWidth ? (
    row
  ) : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {row}
    </ScrollView>
  );
}
