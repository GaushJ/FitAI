"use client";

import { useRef, type ReactNode } from "react";
import { ArrowUp, Camera, Mic, Square } from "lucide-react";
import { Spinner } from "@/components/atoms/Spinner";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";

type ToolbarButtonTone = "neutral" | "recording" | "primary";

const TONES: Record<ToolbarButtonTone, string> = {
  neutral: "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-accent",
  recording: "bg-red-600 shadow-[0_0_16px_rgba(239,68,68,0.5)] hover:bg-red-500",
  primary: "bg-accent hover:bg-accent-light",
};

interface ToolbarButtonProps {
  label: string;
  tone: ToolbarButtonTone;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

function ToolbarButton({ label, tone, type = "button", disabled, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-40",
        TONES[tone],
      )}
    >
      {children}
    </button>
  );
}

interface ComposerToolbarProps {
  isRecording: boolean;
  isProcessing: boolean;
  isScanning: boolean;
  elapsedSeconds: number;
  canSubmit: boolean;
  onScanFiles: (files: File[]) => void;
  onToggleRecording: () => void;
}

/** Camera, mic and send buttons docked in the corner of the composer, chat-style. */
export function ComposerToolbar({
  isRecording,
  isProcessing,
  isScanning,
  elapsedSeconds,
  canSubmit,
  onScanFiles,
  onToggleRecording,
}: ComposerToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute right-3 bottom-3 flex items-center gap-2">
      {isRecording && (
        <span className="mr-1 flex items-center gap-1.5 font-mono text-[10px] font-semibold text-red-400">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-red-500" />
          {formatDuration(elapsedSeconds)}
        </span>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          onScanFiles(files);
        }}
      />
      <ToolbarButton
        label="Scan nutrition label(s)"
        tone="neutral"
        disabled={isRecording || isProcessing || isScanning}
        onClick={() => fileInputRef.current?.click()}
      >
        {isScanning ? <Spinner /> : <Camera className="size-4" />}
      </ToolbarButton>

      <ToolbarButton
        label={isRecording ? "Stop recording" : "Speak instead"}
        tone={isRecording ? "recording" : "neutral"}
        disabled={isProcessing}
        onClick={onToggleRecording}
      >
        {isRecording ? <Square className="size-3.5 fill-white text-white" /> : <Mic className="size-4" />}
      </ToolbarButton>

      <ToolbarButton label="Log this meal" tone="primary" type="submit" disabled={!canSubmit}>
        {isProcessing ? <Spinner className="size-4 text-ink" /> : <ArrowUp className="size-4 text-ink" />}
      </ToolbarButton>
    </div>
  );
}
