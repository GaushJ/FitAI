"use client";

import { useEffect, useRef, useState } from "react";

// Whisper has no "silence" output — it hallucinates plausible text from near-empty
// audio ("Thank you.") instead of failing — so very short takes are never sent.
const MIN_RECORDING_MS = 800;

interface UseAudioRecorderOptions {
  onRecorded: (audio: Blob) => void;
  onError: (message: string) => void;
}

function createRecorder(stream: MediaStream) {
  let options: MediaRecorderOptions = { mimeType: "audio/webm", audioBitsPerSecond: 128000 };
  if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
    options = { mimeType: "audio/ogg", audioBitsPerSecond: 128000 };
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType!)) options = {};
  return new MediaRecorder(stream, options);
}

export function useAudioRecorder({ onRecorded, onError }: UseAudioRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const callbacksRef = useRef({ onRecorded, onError });

  useEffect(() => {
    callbacksRef.current = { onRecorded, onError };
  });

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  const start = async () => {
    chunksRef.current = [];
    try {
      // Plain `audio: true` on purpose: explicit autoGainControl / noiseSuppression
      // needs a moment to calibrate and under-amplifies short takes, which makes
      // Whisper treat real speech as silence.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = createRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (Date.now() - startedAtRef.current < MIN_RECORDING_MS) {
          callbacksRef.current.onError(
            "Recording was too short to transcribe — hold the mic a little longer and speak clearly.",
          );
          return;
        }
        callbacksRef.current.onRecorded(
          new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }),
        );
      };

      startedAtRef.current = Date.now();
      recorder.start(200);
      setElapsedSeconds(0);
      setIsRecording(true);
    } catch {
      callbacksRef.current.onError("Failed to access your microphone. Please verify browser permissions.");
    }
  };

  const stop = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return { isRecording, elapsedSeconds, start, stop };
}
