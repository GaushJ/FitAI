import { View, Text } from "react-native";

interface AccentBadgeProps {
  label: string;
}

/** Small uppercase tracked-out pill, e.g. the "Active AI" badge. */
export function AccentBadge({ label }: AccentBadgeProps) {
  return (
    <View className="rounded-full border border-accent/30 bg-accent/5 px-2.5 py-1">
      <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-accent">{label}</Text>
    </View>
  );
}

interface StatusBadgeProps {
  label: string;
  active: boolean;
}

/** Status-dot pill, e.g. "Set" / "Not set" for API keys. */
export function StatusBadge({ label, active }: StatusBadgeProps) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full border border-border bg-surface-high px-2.5 py-1">
      <View className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-text-muted"}`} />
      <Text className="font-sans text-[11px] text-text-tertiary">{label}</Text>
    </View>
  );
}
