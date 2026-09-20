import { View, Text, Pressable } from "react-native";
import { X, Square } from "lucide-react-native";

interface VoiceRecorderProps {
  seconds: number;
  onCancel: () => void;
  onStop: () => void;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Replaces MealComposer's card content while a voice recording is in
 * progress — matches the approved "recording" mockup state. */
export function VoiceRecorder({ seconds, onCancel, onStop }: VoiceRecorderProps) {
  return (
    <View className="items-center gap-4 rounded-lg border border-danger/35 bg-surface p-5">
      <View className="flex-row items-center gap-2">
        <View className="h-2 w-2 rounded-full bg-danger" />
        <Text className="font-mono text-base font-bold text-danger">{formatTime(seconds)}</Text>
      </View>

      <Text className="font-sans text-xs text-text-secondary">Listening… speak your meal</Text>

      <View className="flex-row items-center gap-5">
        <View className="items-center gap-1.5">
          <Pressable
            onPress={onCancel}
            className="h-11 w-11 items-center justify-center rounded-full bg-surface-high"
            accessibilityRole="button"
            accessibilityLabel="Cancel recording"
          >
            <X size={16} color="#8E9085" />
          </Pressable>
          <Text className="font-sans text-[10px] text-text-muted">Cancel</Text>
        </View>
        <View className="items-center gap-1.5">
          <Pressable
            onPress={onStop}
            className="h-14 w-14 items-center justify-center rounded-full bg-red-600"
            style={{ shadowColor: "#ef4444", shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Stop recording and log meal"
          >
            <Square size={18} color="white" fill="white" />
          </Pressable>
          <Text className="font-sans-semibold text-[10px] text-danger">Stop</Text>
        </View>
      </View>
    </View>
  );
}
