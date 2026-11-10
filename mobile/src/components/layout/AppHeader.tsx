import { Text, View } from "react-native";
import { Flame, Sparkles } from "lucide-react-native";
import { BrandLogo } from "@/components/ui";
import { useProfile } from "@/features/profile/ProfileProvider";
import { pluralize } from "@/lib/nutrition";
import { colors } from "@/theme/colors";

/** Web's phone top bar (logo) combined with its sidebar user card (initial, streak, PRO). */
export function AppHeader() {
  const { profile } = useProfile();
  const name = profile?.name || profile?.username || "";

  return (
    <View className="flex-row items-center justify-between border-b border-line bg-surface px-4 py-3">
      <BrandLogo size="sm" />
      <View className="flex-row items-center gap-2">
        <View className="flex-row items-center gap-1">
          <Flame size={12} color={colors.primary} />
          <Text className="font-mono text-[11px] uppercase tracking-wide text-primary">
            {pluralize(profile?.current_streak ?? 0, "day")} streak
          </Text>
        </View>
        {profile?.is_pro ? (
          <View className="flex-row items-center gap-1 bg-primary px-1.5 py-0.5">
            <Sparkles size={12} color={colors.white} />
            <Text className="font-mono text-[10px] text-white">PRO</Text>
          </View>
        ) : null}
        <View className="h-8 w-8 items-center justify-center bg-ink" accessibilityLabel={name || "Profile"}>
          <Text className="font-display text-base text-white">{name.charAt(0).toUpperCase() || "·"}</Text>
        </View>
      </View>
    </View>
  );
}
