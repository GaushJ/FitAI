import { View, Text } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

interface TargetFieldProps {
  label: string;
  labelColor?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric";
  className?: string;
}

/** Labeled input for the Settings sheet — text name field and the four
 * numeric target fields share this. Uses BottomSheetTextInput so Android's
 * keyboard doesn't fight the sheet's own gesture handling. */
export function TargetField({
  label,
  labelColor = "#6E7066",
  value,
  onChangeText,
  keyboardType = "default",
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
        keyboardType={keyboardType}
        className="rounded-sm border border-border-subtle bg-bg px-3.5 py-3 font-mono text-sm text-text-primary"
      />
    </View>
  );
}
