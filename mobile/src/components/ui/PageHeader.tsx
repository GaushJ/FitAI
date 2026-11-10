import { Text, View } from "react-native";

// Mirrors frontend/src/features/app-shell/components/PageHeader.tsx.
interface PageHeaderProps {
  /** Mono kicker above the title, e.g. "Today's macro dashboard". */
  eyebrow: string;
  title: string;
  /** Inline element after the title, e.g. a "10 saved" badge. */
  titleAccessory?: React.ReactNode;
  description?: string;
  /** Buttons below the title (web puts them right-aligned on wide screens). */
  actions?: React.ReactNode;
}

/** Top-of-page title block shared by every app screen. */
export function PageHeader({ eyebrow, title, titleAccessory, description, actions }: PageHeaderProps) {
  return (
    <View className="mb-8 gap-4 border-b border-line pb-6">
      <View>
        <Text className="font-mono-medium text-xs uppercase tracking-widest text-primary">
          {"// "}
          {eyebrow}
        </Text>
        <View className="mt-2 flex-row flex-wrap items-center gap-3">
          <Text className="font-display text-4xl uppercase leading-none tracking-tight text-ink">{title}</Text>
          {titleAccessory}
        </View>
        {description ? <Text className="mt-3 font-sans text-base text-ink-muted">{description}</Text> : null}
      </View>
      {actions ? <View className="flex-row flex-wrap items-center gap-2">{actions}</View> : null}
    </View>
  );
}
