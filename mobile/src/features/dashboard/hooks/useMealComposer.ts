import { useEffect, useRef, useState } from "react";
import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder } from "expo-audio";
import type { ImagePickerAsset } from "expo-image-picker";
import type { Notifier } from "@/hooks/useFeedback";
import { getErrorMessage } from "@/lib/errors";
import { pluralize } from "@/lib/nutrition";
import { scanNutritionLabels, trackMealWithText, transcribeAudio } from "../api";

// Same guard and copy as web's useAudioRecorder.
const MIN_RECORDING_MS = 800;
const MIC_DENIED = "Failed to access your microphone. Please verify microphone permissions.";

interface UseMealComposerOptions {
  notify: Notifier;
  onMealLogged: () => Promise<void> | void;
}

/** State and actions behind the "Log a meal" box: typed text, voice and label scanning.
 * Same flow and messages as web's features/meals/hooks/useMealComposer.ts. */
export function useMealComposer({ notify, onMealLogged }: UseMealComposerOptions) {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // Guard against a leaked interval if the screen unmounts mid-recording.
  useEffect(() => stopTimer, []);

  const transcribe = async (uri: string) => {
    setIsProcessing(true);
    notify.clear();
    try {
      const { transcript } = await transcribeAudio(uri);
      setText(transcript);
      notify.success("Transcribed! Review and edit below, then tap send.");
    } catch (err) {
      notify.error(getErrorMessage(err, "Network error while transcribing."));
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    notify.clear();
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        notify.error(MIC_DENIED);
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAtRef.current = Date.now();
      setElapsedSeconds(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } catch {
      notify.error(MIC_DENIED);
    }
  };

  const stopRecording = async () => {
    stopTimer();
    setIsRecording(false);
    try {
      await recorder.stop();
    } catch {
      notify.error("Recording failed.");
      return;
    }
    if (Date.now() - startedAtRef.current < MIN_RECORDING_MS) {
      notify.error("Recording was too short to transcribe — hold the mic a little longer and speak clearly.");
      return;
    }
    if (recorder.uri) await transcribe(recorder.uri);
  };

  const submit = async () => {
    const query = text.trim();
    if (!query) return;
    setIsProcessing(true);
    notify.clear();
    try {
      const result = await trackMealWithText(query);
      notify.success(`Meal logged! ${Math.round(result.macros?.calories ?? 0)} kcal tracked.`);
      if (result.warning) notify.error(`⚠️ ${result.warning}`);
      setText("");
      await onMealLogged();
    } catch (err) {
      notify.error(getErrorMessage(err, "Network error while processing meal."));
    } finally {
      setIsProcessing(false);
    }
  };

  // Each photographed label is vision-extracted and saved to the master ingredient cache, so later
  // meals naming that product resolve to its exact label macros.
  const scan = async (assets: ImagePickerAsset[]) => {
    if (assets.length === 0) return;
    setIsScanning(true);
    notify.clear();
    try {
      const { saved = [], failed = [] } = await scanNutritionLabels(
        assets.map((asset, i) => ({
          uri: asset.uri,
          name: asset.fileName ?? `label-${i}.jpg`,
          type: asset.mimeType ?? "image/jpeg",
        }))
      );
      if (saved.length > 0) {
        const names = saved.map((s) => `${s.brand ? s.brand + " " : ""}${s.name}`.trim()).join(", ");
        const unreadable = failed.length ? ` ${pluralize(failed.length, "label")} couldn't be read.` : "";
        notify.success(`Saved macros for ${names}.${unreadable}`);
      } else {
        notify.error("Couldn't read any of the scanned labels. Try clearer, well-lit photos.");
      }
    } catch (err) {
      notify.error(getErrorMessage(err, "Network error while scanning labels."));
    } finally {
      setIsScanning(false);
    }
  };

  return { text, setText, isProcessing, isScanning, isRecording, elapsedSeconds, startRecording, stopRecording, submit, scan };
}
