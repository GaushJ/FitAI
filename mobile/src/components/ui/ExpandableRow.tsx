import { useState } from "react";
import { Pressable, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

interface ExpandableRowProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

/** Header always visible; tapping toggles the detail content below it. Used by
 * the dashboard's meal log list and the progress screen's history list. */
export function ExpandableRow({ header, children, defaultExpanded = false }: ExpandableRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View className="rounded-md border border-border-subtle bg-surface-inset p-3.5">
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        className="flex-row items-center justify-between"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View className="flex-1">{header}</View>
        {expanded ? (
          <ChevronUp size={16} color="#6E7066" />
        ) : (
          <ChevronDown size={16} color="#6E7066" />
        )}
      </Pressable>
      {expanded ? <View className="mt-3 border-t border-border-subtle pt-3">{children}</View> : null}
    </View>
  );
}
