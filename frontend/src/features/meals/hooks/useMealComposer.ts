"use client";

import { useState, type FormEvent } from "react";
import type { Notifier } from "@/hooks/useFeedback";
import { getErrorMessage } from "@/lib/errors";
import { pluralize } from "@/lib/nutrition";
import { scanLabels, trackMeal, transcribeAudio } from "@/features/meals/api";
import { useAudioRecorder } from "@/features/meals/hooks/useAudioRecorder";

interface UseMealComposerOptions {
  notify: Notifier;
  /** Called after a meal is logged, with the new meal's id when the API returns one. */
  onMealLogged: (mealId?: number) => Promise<void> | void;
}

/** State and actions behind the "Log a meal" box: typed text, voice and label scanning. */
export function useMealComposer({ notify, onMealLogged }: UseMealComposerOptions) {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const transcribe = async (audio: Blob) => {
    setIsProcessing(true);
    notify.clear();
    try {
      const { transcript } = await transcribeAudio(audio);
      setText(transcript);
      notify.success("Transcribed! Review and edit below, then tap send.");
    } catch (err) {
      notify.error(getErrorMessage(err, "Network error while transcribing."));
    } finally {
      setIsProcessing(false);
    }
  };

  const recorder = useAudioRecorder({ onRecorded: transcribe, onError: notify.error });

  const startRecording = () => {
    notify.clear();
    return recorder.start();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const query = text.trim();
    if (!query) return;
    setIsProcessing(true);
    notify.clear();
    try {
      const result = await trackMeal(query);
      notify.success(`Meal logged! ${Math.round(result.macros?.calories ?? 0)} kcal tracked.`);
      if (result.warning) notify.error(`⚠️ ${result.warning}`);
      setText("");
      await onMealLogged(result.id);
    } catch (err) {
      notify.error(getErrorMessage(err, "Network error while processing meal."));
    } finally {
      setIsProcessing(false);
    }
  };

  // Each photographed label is vision-extracted and saved to the master ingredient
  // cache, so later meals naming that product resolve to its exact label macros.
  const scan = async (files: File[]) => {
    if (files.length === 0) return;
    setIsScanning(true);
    notify.clear();
    try {
      const { saved = [], failed = [] } = await scanLabels(files);
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

  return {
    text,
    setText,
    isProcessing,
    isScanning,
    isRecording: recorder.isRecording,
    elapsedSeconds: recorder.elapsedSeconds,
    startRecording,
    stopRecording: recorder.stop,
    submit,
    scan,
  };
}
