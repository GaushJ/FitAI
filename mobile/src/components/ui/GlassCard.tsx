import { View, type ViewProps } from "react-native";

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
}

/** The base panel used everywhere: macro summaries, meal lists, saved meals, progress sections. */
export function GlassCard({ children, className = "", ...rest }: GlassCardProps) {
  return (
    <View
      className={`rounded-lg border border-border bg-surface p-5 ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
