import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors } from "@/theme/colors";

// Mirrors frontend/src/components/molecules/EmptyState.tsx.
interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  /** "lg" is a full panel placeholder, "sm" a compact hint. */
  size?: "sm" | "lg";
  /** Dashed outline; turn off for a bare centred message. */
  bordered?: boolean;
  children?: string;
}

export function EmptyState({ icon: Icon, title, size = "lg", bordered = true, children }: EmptyStateProps) {
  return (
    <View
      className={`items-center justify-center px-4 ${size === "lg" ? "py-14" : "py-7"} ${
        bordered ? "border border-dashed border-line-strong bg-surface-low" : ""
      }`}
    >
      {Icon ? (
        <View className="mb-3 h-11 w-11 items-center justify-center border border-line bg-card">
          <Icon size={20} color={colors.inkSubtle} />
        </View>
      ) : null}
      {title ? (
        <Text className="text-center font-display-semibold text-base uppercase tracking-wide text-ink">{title}</Text>
      ) : null}
      {children ? (
        <Text className={`max-w-sm text-center font-sans text-sm text-ink-muted ${title ? "mt-1" : ""}`}>{children}</Text>
      ) : null}
    </View>
  );
}
