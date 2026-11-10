import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Camera, Lightbulb, Mic, SendHorizontal, Square, type LucideIcon } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Card, SectionHeading } from "@/components/ui";
import type { Notifier } from "@/hooks/useFeedback";
import { formatDuration } from "@/lib/format";
import { colors, pressed, shadows } from "@/theme/colors";
import { useMealComposer } from "../hooks/useMealComposer";
import { ScanSourceModal } from "./ScanSourceModal";

// Port of web's features/meals/components/MealComposer.tsx + ComposerToolbar.tsx.
type ToolbarTone = "neutral" | "recording" | "primary";

function ToolbarButton({
  label,
  tone,
  disabled,
  busy,
  icon: Icon,
  onPress,
}: {
  label: string;
  tone: ToolbarTone;
  disabled?: boolean;
  busy?: boolean;
  icon: LucideIcon;
  onPress: () => void;
}) {
  const box = tone === "neutral" ? "border border-line-strong bg-card" : "bg-primary";
  const iconColor = tone === "neutral" ? colors.inkMuted : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={`h-10 w-10 items-center justify-center rounded-xs ${box} ${disabled ? "opacity-40" : ""}`}
      style={({ pressed: isPressed }) => (tone === "primary" ? (isPressed ? pressed(3) : shadows.hardPrimary) : undefined)}
    >
      {busy ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <Icon size={18} color={iconColor} fill={tone === "recording" ? colors.white : "none"} />
      )}
    </Pressable>
  );
}

interface MealComposerProps {
  notify: Notifier;
  onMealLogged: () => Promise<void> | void;
  onOpenBrandPreferences: () => void;
}

export function MealComposer({ notify, onMealLogged, onOpenBrandPreferences }: MealComposerProps) {
  const composer = useMealComposer({ notify, onMealLogged });
  const { text, isRecording, isProcessing, isScanning } = composer;
  const [choosingSource, setChoosingSource] = useState(false);

  const status = isRecording
    ? "Listening — tap the square to stop."
    : isProcessing
      ? "Transcribing and resolving macros..."
      : isScanning
        ? "Reading nutrition label(s)..."
        : " ";

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return notify.error("Camera permission is required to scan a label.");
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled && result.assets) await composer.scan(result.assets);
  };

  const chooseFromLibrary = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return notify.error("Photo library permission is required to scan a label.");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, quality: 0.7 });
    if (!result.canceled && result.assets) await composer.scan(result.assets);
  };

  return (
    <Card tone="raised">
      <SectionHeading index="02" subtitle="Text · Voice · Label photo">
        Log a meal
      </SectionHeading>

      <View className="mt-5">
        <View className={`border ${isRecording ? "border-primary" : "border-line-strong"} bg-surface-low`}>
          <TextInput
            multiline
            numberOfLines={3}
            placeholder="Type what you ate… e.g. '200ml Nandini milk and 2 eggs'"
            placeholderTextColor={colors.inkSubtle}
            accessibilityLabel="Describe your meal"
            value={text}
            onChangeText={composer.setText}
            editable={!isRecording && !isProcessing}
            className={`min-h-[136px] p-4 pb-16 font-mono text-sm leading-relaxed text-ink ${isRecording || isProcessing ? "opacity-50" : ""}`}
            style={{ textAlignVertical: "top" }}
          />

          <View className="absolute bottom-3 right-3 flex-row items-center gap-2">
            {isRecording ? (
              <View className="mr-1 flex-row items-center gap-1.5">
                <View className="h-1.5 w-1.5 bg-primary" />
                <Text className="font-mono-medium text-xs text-primary">{formatDuration(composer.elapsedSeconds)}</Text>
              </View>
            ) : null}
            <ToolbarButton
              label="Scan nutrition label(s)"
              tone="neutral"
              icon={Camera}
              busy={isScanning}
              disabled={isRecording || isProcessing || isScanning}
              onPress={() => setChoosingSource(true)}
            />
            <ToolbarButton
              label={isRecording ? "Stop recording" : "Speak instead"}
              tone={isRecording ? "recording" : "neutral"}
              icon={isRecording ? Square : Mic}
              disabled={isProcessing}
              onPress={isRecording ? composer.stopRecording : composer.startRecording}
            />
            <ToolbarButton
              label="Log this meal"
              tone="primary"
              icon={SendHorizontal}
              busy={isProcessing}
              disabled={isRecording || isProcessing || !text.trim()}
              onPress={composer.submit}
            />
          </View>
        </View>

        <Text accessibilityLiveRegion="polite" className="mt-1.5 h-4 font-mono text-[11px] text-ink-muted">
          {status}
        </Text>
      </View>

      <View className="mt-3 flex-row gap-3 border border-line bg-surface-low p-4">
        <Lightbulb size={16} color={colors.ink} style={{ marginTop: 2 }} />
        <Text className="flex-1 font-sans text-sm text-ink-muted">
          <Text className="font-sans-bold text-ink">Tip:</Text> mention brands naturally —{" "}
          <Text className="font-mono text-ink">&ldquo;200ml Nandini milk&rdquo;</Text> or{" "}
          <Text className="font-mono text-ink">&ldquo;1 scoop Optimum Nutrition whey&rdquo;</Text>. Save{" "}
          <Text className="font-sans-medium text-primary underline" onPress={onOpenBrandPreferences} accessibilityRole="link">
            brand preferences
          </Text>{" "}
          to lock in exact label macros.
        </Text>
      </View>

      {choosingSource ? (
        <ScanSourceModal onTakePhoto={takePhoto} onChooseLibrary={chooseFromLibrary} onClose={() => setChoosingSource(false)} />
      ) : null}
    </Card>
  );
}
