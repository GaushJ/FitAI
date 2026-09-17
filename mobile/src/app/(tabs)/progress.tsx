import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Temporary placeholder — the real Progress screen (stats, activity heatmap,
 * weekly chart, history) is M4 and needs its own mockup pass first.
 */
export default function ProgressScreen() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 items-center justify-center gap-2 bg-bg p-6">
      <Text className="font-display text-lg text-text-primary">Progress</Text>
      <Text className="text-center font-sans text-sm text-text-secondary">
        Coming in M4 — stats, activity heatmap, and history.
      </Text>
    </SafeAreaView>
  );
}
