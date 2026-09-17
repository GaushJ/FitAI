import { View, Text } from "react-native";
import { Award, Calendar, Flame, Utensils } from "lucide-react-native";
import type { ProgressStats } from "../types";

interface StatsGridProps {
  stats: ProgressStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const cards = [
    { icon: Flame, color: "#fb923c", label: "Current Streak", value: `${stats.current_streak} days` },
    { icon: Award, color: "#fbbf24", label: "Best Streak", value: `${stats.best_streak} days` },
    { icon: Calendar, color: "#22d3ee", label: "Days Logged", value: `${stats.total_days_logged} days` },
    { icon: Utensils, color: "#C9F24D", label: "Total Meals", value: String(stats.total_meals) },
  ];

  return (
    <View className="flex-row flex-wrap gap-2">
      {cards.map(({ icon: Icon, color, label, value }) => (
        <View key={label} className="min-w-[47%] flex-1 rounded-md border border-border bg-surface p-3">
          <View className="mb-1.5 flex-row items-center gap-1.5">
            <Icon size={13} color={color} />
            <Text className="font-sans text-[10px] text-text-secondary">{label}</Text>
          </View>
          <Text className="font-display text-[19px] text-text-primary">{value}</Text>
        </View>
      ))}
    </View>
  );
}
