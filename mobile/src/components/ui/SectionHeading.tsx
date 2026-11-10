import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors } from "@/theme/colors";

// Mirrors frontend/src/components/molecules/SectionHeading.tsx.
interface SectionHeadingProps {
  /** Short code shown in a dark box before the title, e.g. "02". */
  index?: string;
  /** Leading icon, e.g. Tag. */
  icon?: LucideIcon;
  subtitle?: string;
  /** Right-aligned slot (buttons, counters). On phones it wraps below the title like web's flex-wrap. */
  action?: React.ReactNode;
  className?: string;
  children: string;
}

/** Panel title in the design's "[ 02 ] LOG A MEAL" style. */
export function SectionHeading({ index, icon: Icon, subtitle, action, className = "", children }: SectionHeadingProps) {
  return (
    <View className={`flex-row flex-wrap items-start justify-between gap-3 ${className}`}>
      <View className="min-w-0 flex-shrink flex-row items-start gap-3">
        {index ? (
          <View className="bg-ink px-2 py-0.5">
            <Text className="font-mono-medium text-sm text-white">[ {index} ]</Text>
          </View>
        ) : null}
        {Icon ? (
          <View className="mt-0.5">
            <Icon size={20} color={colors.primary} />
          </View>
        ) : null}
        <View className="min-w-0 flex-shrink">
          <Text className="font-display-semibold text-xl uppercase leading-tight tracking-tight text-ink">{children}</Text>
          {subtitle ? <Text className="mt-0.5 font-mono text-xs text-ink-muted">{subtitle}</Text> : null}
        </View>
      </View>
      {action}
    </View>
  );
}
