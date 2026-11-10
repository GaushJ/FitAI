import { View, type ViewProps } from "react-native";
import { shadows } from "@/theme/colors";

// Mirrors frontend/src/components/atoms/Card.tsx (phone-width padding).
type Padding = "none" | "md" | "lg";
type Tone = "plain" | "raised" | "muted";

const PADDING: Record<Padding, string> = { none: "", md: "p-4", lg: "p-5" };

const TONES: Record<Tone, string> = {
  plain: "border border-line bg-card",
  /** Hard ink shadow — the design's "primary panel" treatment. */
  raised: "border border-ink bg-card",
  muted: "border border-line bg-surface-low",
};

interface CardProps extends ViewProps {
  padding?: Padding;
  tone?: Tone;
}

/** Square-cornered panel used for every app section. */
export function Card({ padding = "lg", tone = "plain", className = "", style, ...rest }: CardProps) {
  return (
    <View
      className={`${TONES[tone]} ${PADDING[padding]} ${className}`}
      style={[tone === "raised" ? shadows.hard : null, style]}
      {...rest}
    />
  );
}
