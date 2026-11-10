import { View } from "react-native";

// Mirrors frontend/src/components/atoms/ProgressBar.tsx.
interface ProgressBarProps {
  /** 0–150; values over 100 are clipped to a full bar. */
  percent: number;
  fillClassName?: string;
  label?: string;
  className?: string;
}

export function ProgressBar({ percent, fillClassName = "bg-ink", label, className = "" }: ProgressBarProps) {
  const width = Math.max(0, Math.min(percent, 100));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      className={`h-2 w-full overflow-hidden bg-surface-highest ${className}`}
    >
      <View testID="progress-bar-fill" className={`h-full ${fillClassName}`} style={{ width: `${width}%` }} />
    </View>
  );
}
