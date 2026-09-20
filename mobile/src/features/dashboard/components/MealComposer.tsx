import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Camera, Mic, ArrowRight } from "lucide-react-native";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Banner } from "@/components/ui";
import { scanNutritionLabels, trackMealWithAudio, trackMealWithText } from "../api";
import type { ScanLabelImage } from "../api";
import type { TrackMealResponse } from "../types";
import { VoiceRecorder } from "./VoiceRecorder";
import { ScanLabelSheet } from "./ScanLabelSheet";

interface MealComposerProps {
  onLogged: (result: TrackMealResponse) => void;
}

export function MealComposer({ onLogged }: MealComposerProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanSheetRef = useRef<BottomSheetModal>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Guard against a leaked interval if the screen unmounts mid-recording
  // (e.g. the user navigates away without tapping stop/cancel).
  useEffect(() => stopTimer, []);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    setError("");
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setError("Microphone permission is required to record.");
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setSeconds(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    } catch {
      setError("Failed to access the microphone.");
    }
  };

  const handleCancelRecording = async () => {
    stopTimer();
    setIsRecording(false);
    try {
      await recorder.stop();
    } catch {
      // Already stopped/never started successfully — nothing to clean up.
    }
  };

  const handleStopAndSubmit = async () => {
    stopTimer();
    setIsRecording(false);
    try {
      await recorder.stop();
    } catch {
      setError("Recording failed.");
      return;
    }
    const uri = recorder.uri;
    if (!uri) {
      setError("Recording failed — no audio captured.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await trackMealWithAudio(uri);
      onLogged(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log meal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitText = async () => {
    if (!text.trim() || isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      const result = await trackMealWithText(text.trim());
      onLogged(result);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log meal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const runScan = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setError("");
    setScanMessage("");
    setIsScanning(true);
    try {
      const images: ScanLabelImage[] = assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName ?? `label-${index}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      }));
      const result = await scanNutritionLabels(images);
      if (result.saved.length > 0) {
        const names = result.saved.map((s) => `${s.brand ? s.brand + " " : ""}${s.name}`.trim()).join(", ");
        const failedNote =
          result.failed.length > 0
            ? ` ${result.failed.length} label${result.failed.length !== 1 ? "s" : ""} couldn't be read.`
            : "";
        setScanMessage(`Saved macros for ${names}.${failedNote}`);
      } else {
        setError("Couldn't read any of the scanned labels. Try clearer, well-lit photos.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error while scanning labels.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenScanSheet = () => {
    setError("");
    setScanMessage("");
    scanSheetRef.current?.present();
  };

  const handleTakePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      setError("Camera permission is required to scan a label.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled || !result.assets) return;
    await runScan(result.assets);
  };

  const handleChooseLibrary = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      setError("Photo library permission is required to scan a label.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets) return;
    await runScan(result.assets);
  };

  if (isRecording) {
    return <VoiceRecorder seconds={seconds} onCancel={handleCancelRecording} onStop={handleStopAndSubmit} />;
  }

  const busy = isSubmitting || isScanning;

  return (
    <View className="gap-2">
      <View className="relative rounded-lg border border-border bg-surface p-4 pb-[62px]">
        <TextInput
          multiline
          numberOfLines={2}
          value={text}
          onChangeText={setText}
          placeholder="Log a meal… e.g. 2 eggs and toast"
          placeholderTextColor="#6E7066"
          editable={!busy}
          className="font-sans text-sm text-text-primary"
        />

        <View className="absolute bottom-3.5 right-3.5 flex-row items-center gap-2">
          <Pressable
            onPress={handleOpenScanSheet}
            disabled={busy}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-high"
            accessibilityRole="button"
            accessibilityLabel="Scan a nutrition label"
          >
            {isScanning ? <ActivityIndicator size="small" color="#F4F5EF" /> : <Camera size={15} color="#8E9085" />}
          </Pressable>
          <Pressable
            onPress={handleStartRecording}
            disabled={busy}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-high"
            accessibilityRole="button"
            accessibilityLabel="Record a voice note"
          >
            <Mic size={15} color="#8E9085" />
          </Pressable>
          <Pressable
            onPress={handleSubmitText}
            disabled={!text.trim() || busy}
            className={`h-9 w-9 items-center justify-center rounded-full ${
              text.trim() && !busy ? "bg-accent" : "bg-surface-inset"
            }`}
            accessibilityRole="button"
            accessibilityLabel="Log meal"
          >
            <ArrowRight size={15} color={text.trim() && !busy ? "#0B0C09" : "#6E7066"} />
          </Pressable>
        </View>
      </View>

      <Text className="min-h-[15px] pl-0.5 font-sans text-[11px] text-text-secondary">
        {isScanning ? "Reading nutrition label(s)…" : ""}
      </Text>

      {error ? <Banner variant="error" message={error} /> : null}
      {scanMessage ? <Banner variant="success" message={scanMessage} /> : null}

      <ScanLabelSheet ref={scanSheetRef} onTakePhoto={handleTakePhoto} onChooseLibrary={handleChooseLibrary} />
    </View>
  );
}
