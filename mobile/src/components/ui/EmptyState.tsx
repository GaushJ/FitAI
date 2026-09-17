import { View, Text } from "react-native";
import { Inbox } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

interface EmptyStateProps {
  label: string;
  icon?: LucideIcon;
}

export function EmptyState({ label, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <View className="items-center gap-1.5 rounded-md border border-dashed border-border p-6">
      <Icon size={20} color="#6E7066" />
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
    </View>
  );
}
