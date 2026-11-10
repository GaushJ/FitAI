"use client";

import Link from "next/link";
import { Lightbulb } from "lucide-react";
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
    <Card tone="raised">
      <SectionHeading index="02" subtitle="Text · Voice · Label photo">
        Log a meal
      </SectionHeading>

      <form onSubmit={composer.submit} className="mt-5">
        <div
          className={cn(
            "relative border bg-surface-low transition-colors",
            isRecording ? "border-primary" : "border-line-strong focus-within:border-ink focus-within:bg-card",
          )}
        >
          <textarea
            rows={3}
            placeholder="Type what you ate… e.g. '200ml Nandini milk and 2 eggs'"
            aria-label="Describe your meal"
            value={text}
            onChange={(e) => composer.setText(e.target.value)}
            disabled={isRecording || isProcessing}
            className="block w-full resize-none bg-transparent p-4 pb-16 font-mono text-sm leading-relaxed text-ink placeholder:text-ink-subtle focus:outline-none disabled:opacity-50"
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

        <p aria-live="polite" className="mt-1.5 h-4 font-mono text-[11px] text-ink-muted">
          {status}
        </p>
      </form>

      <div className="mt-3 flex gap-3 border border-line bg-surface-low p-4 text-sm text-ink-muted">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-ink" />
        <p>
          <strong className="text-ink">Tip:</strong> mention brands naturally —{" "}
          <span className="font-mono text-ink">&ldquo;200ml Nandini milk&rdquo;</span> or{" "}
          <span className="font-mono text-ink">&ldquo;1 scoop Optimum Nutrition whey&rdquo;</span>. Save{" "}
          <Link href="/brand-preferences" className="font-medium text-primary underline underline-offset-2">
            brand preferences
          </Link>{" "}
          to lock in exact label macros.
        </p>
      </div>
    </Card>
  );
}
