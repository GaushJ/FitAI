import { useEffect, useRef, useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Mic, ArrowRight } from "lucide-react-native";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import { GlassCard, Banner } from "@/components/ui";
import { trackMealWithAudio, trackMealWithText } from "../api";
import type { TrackMealResponse } from "../types";
import { VoiceRecorder } from "./VoiceRecorder";

interface MealComposerProps {
  onLogged: (result: TrackMealResponse) => void;
}

export function MealComposer({ onLogged }: MealComposerProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  if (isRecording) {
    return <VoiceRecorder seconds={seconds} onCancel={handleCancelRecording} onStop={handleStopAndSubmit} />;
  }

  return (
    <GlassCard className="gap-2">
      <TextInput
        multiline
        numberOfLines={2}
        value={text}
        onChangeText={setText}
        placeholder="Log a meal… e.g. 2 eggs and toast"
        placeholderTextColor="#6E7066"
        editable={!isSubmitting}
        className="font-sans text-sm text-text-primary"
      />
      <View className="flex-row items-center justify-end gap-2">
        <Pressable
          onPress={handleStartRecording}
          disabled={isSubmitting}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-high"
          accessibilityRole="button"
          accessibilityLabel="Record a voice note"
        >
          <Mic size={15} color="#8E9085" />
        </Pressable>
        <Pressable
          onPress={handleSubmitText}
          disabled={!text.trim() || isSubmitting}
          className={`h-9 w-9 items-center justify-center rounded-full ${
            text.trim() && !isSubmitting ? "bg-accent" : "bg-surface-inset"
          }`}
          accessibilityRole="button"
          accessibilityLabel="Log meal"
        >
          <ArrowRight size={15} color={text.trim() && !isSubmitting ? "#0B0C09" : "#6E7066"} />
        </Pressable>
      </View>
      {error ? <Banner variant="error" message={error} /> : null}
    </GlassCard>
  );
}
