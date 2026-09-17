import { View } from "react-native";

interface ProgressBarProps {
  /** 0-100+ (values over 100 are clamped visually but the color can still reflect overage via `color`). */
  percent: number;
  /** Tailwind color class for the fill, e.g. "bg-macro-protein" or "bg-macro-calories". */
  color: string;
  /** Track height in the `h-*` scale — defaults to the thin macro-bar size. */
  height?: "h-1.5" | "h-2.5" | "h-3";
}

export function ProgressBar({ percent, color, height = "h-1.5" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View className={`w-full overflow-hidden rounded-full border border-border bg-surface-inset ${height}`}>
      <View
        testID="progress-bar-fill"
        className={`h-full rounded-full ${color}`}
        style={{ width: `${clamped}%` }}
      />
    </View>
  );
}
