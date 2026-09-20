import { View, Text } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

interface TargetFieldProps {
  label: string;
  labelColor?: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Fires when the field loses focus (calories uses this to rescale the macros). */
  onEndEditing?: () => void;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  /** Small muted line under the input, e.g. "≈ 640 kcal". */
  hint?: string;
  className?: string;
}

/** Labeled input for the Settings sheet — text name field and the numeric fields share this.
 * Uses BottomSheetTextInput so Android's keyboard doesn't fight the sheet's own gesture handling. */
export function TargetField({
  label,
  labelColor = "#6E7066",
  value,
  onChangeText,
  onEndEditing,
  keyboardType = "default",
  hint,
  className = "",
}: TargetFieldProps) {
  return (
    <View className={`gap-1.5 ${className}`}>
      <Text
        className="font-sans-bold text-[10px] uppercase tracking-widest"
        style={{ color: labelColor }}
      >
        {label}
      </Text>
      <BottomSheetTextInput
        value={value}
        onChangeText={onChangeText}
        onEndEditing={onEndEditing}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        className="rounded-sm border border-border-subtle bg-bg px-3.5 py-3 font-mono text-sm text-text-primary"
      />
      {hint ? <Text className="font-sans text-[10px] text-text-muted">{hint}</Text> : null}
    </View>
  );
}
