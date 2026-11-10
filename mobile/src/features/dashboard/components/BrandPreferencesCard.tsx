import { Pressable, Text, View } from "react-native";
import { FileSpreadsheet, Pencil, ScanLine, Tags } from "lucide-react-native";
import { Badge, Card } from "@/components/ui";
import { colors } from "@/theme/colors";

// Port of web's features/dashboard/components/BrandPreferencesCard.tsx.
const METHODS = [
  { label: "By name", icon: Pencil },
  { label: "Label photo", icon: ScanLine },
  { label: "Excel sync", icon: FileSpreadsheet },
];

/** Dashboard shortcut into the Brand Preferences page. */
export function BrandPreferencesCard({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <Card>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          <Tags size={20} color={colors.primary} />
          <Text className="font-display-semibold text-xl uppercase tracking-tight text-ink">Brand preferences</Text>
        </View>
        <Badge tone="muted">{`${count} saved`}</Badge>
      </View>
      <Text className="mt-2 font-sans text-sm text-ink-muted">
        Your saved brands are applied automatically when an ingredient is logged without one.
      </Text>
      <View className="mt-4 flex-row gap-2">
        {METHODS.map(({ label, icon: Icon }) => (
          <Pressable
            key={label}
            onPress={onOpen}
            accessibilityRole="link"
            className="flex-1 items-center gap-1.5 border border-line bg-surface-low px-2 py-3"
          >
            <Icon size={16} color={colors.inkMuted} />
            <Text className="text-center font-mono text-[11px] text-ink-muted">{label}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}
