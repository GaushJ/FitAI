"use client";

import { Utensils } from "lucide-react";
import { Card } from "@/components/atoms/Card";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { cn } from "@/lib/cn";
import type { Notifier } from "@/hooks/useFeedback";
import { ComposerToolbar } from "@/features/meals/components/ComposerToolbar";
import { useMealComposer } from "@/features/meals/hooks/useMealComposer";

interface MealComposerProps {
  notify: Notifier;
  onMealLogged: (mealId?: number) => Promise<void> | void;
}

export function MealComposer({ notify, onMealLogged }: MealComposerProps) {
  const composer = useMealComposer({ notify, onMealLogged });
  const { text, isRecording, isProcessing, isScanning } = composer;

  const status = isRecording
    ? "Listening — tap the square to stop."
    : isProcessing
      ? "Transcribing and resolving macros..."
      : isScanning
        ? "Reading nutrition label(s)..."
        : " ";

  return (
    <Card padding="xl" className="relative flex min-h-[420px] flex-col overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/8 blur-[40px]" />

      <div className="z-10">
        <SectionHeading icon={<Utensils className="text-accent" />}>
          Log a meal
        </SectionHeading>
        <p className="mt-1 text-xs text-slate-400">
          Type what you ate, tap the mic to say it, or scan a nutrition label.
        </p>
      </div>

      <form onSubmit={composer.submit} className="z-10 mt-6 flex flex-col gap-2">
        <div
          className={cn(
            "relative rounded-2xl border bg-slate-950/80 shadow-inner transition-colors",
            isRecording ? "border-red-500/60" : "border-slate-800 focus-within:border-accent/70",
          )}
        >
          <textarea
            rows={3}
            placeholder="e.g. '200ml Nandini milk and 2 eggs'"
            aria-label="Describe your meal"
            value={text}
            onChange={(e) => composer.setText(e.target.value)}
            disabled={isRecording || isProcessing}
            className="w-full resize-none bg-transparent p-4 pb-12 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
          />

          <ComposerToolbar
            isRecording={isRecording}
            isProcessing={isProcessing}
            isScanning={isScanning}
            elapsedSeconds={composer.elapsedSeconds}
            canSubmit={!isRecording && !isProcessing && Boolean(text.trim())}
            onScanFiles={composer.scan}
            onToggleRecording={isRecording ? composer.stopRecording : composer.startRecording}
          />
        </div>

        <p className="h-3.5 pl-1 text-[10px] text-slate-500">{status}</p>
      </form>
    </Card>
  );
}
