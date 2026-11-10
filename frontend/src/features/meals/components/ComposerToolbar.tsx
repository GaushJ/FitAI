"use client";

import { useRef, type ReactNode } from "react";
import { Camera, Mic, SendHorizontal, Square } from "lucide-react";
import { Spinner } from "@/components/atoms/Spinner";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";

type ToolbarButtonTone = "neutral" | "recording" | "primary";

const TONES: Record<ToolbarButtonTone, string> = {
  neutral: "border border-line-strong bg-card text-ink-muted hover:border-ink hover:text-ink",
  recording: "bg-primary text-white animate-pulse",
  primary: "bg-primary text-white shadow-hard-primary press-3d hover:bg-primary-bright",
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
        "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xs transition disabled:cursor-not-allowed disabled:opacity-40 [&>svg]:size-[18px]",
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

/** Camera, mic and send buttons docked in the bottom-right of the composer. */
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
        <span className="mr-1 flex items-center gap-1.5 font-mono text-xs font-medium text-primary">
          <span className="size-1.5 animate-ping bg-primary" />
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
        {isScanning ? <Spinner /> : <Camera />}
      </ToolbarButton>

      <ToolbarButton
        label={isRecording ? "Stop recording" : "Speak instead"}
        tone={isRecording ? "recording" : "neutral"}
        disabled={isProcessing}
        onClick={onToggleRecording}
      >
        {isRecording ? <Square className="fill-white" /> : <Mic />}
      </ToolbarButton>

      <ToolbarButton label="Log this meal" tone="primary" type="submit" disabled={!canSubmit}>
        {isProcessing ? <Spinner /> : <SendHorizontal />}
      </ToolbarButton>
    </div>
  );
}
