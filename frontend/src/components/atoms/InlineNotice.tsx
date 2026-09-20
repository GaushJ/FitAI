import { cn } from "@/lib/cn";
import type { Notice } from "@/types/notice";

const TONES = { success: "text-emerald-400", error: "text-red-400", warning: "text-amber-400" } as const;

/** One-line coloured status text for tight spaces (inline edit forms). */
export function InlineNotice({ notice }: { notice: Notice }) {
  return (
    <p className={cn("text-[11px]", TONES[notice.tone])}>
      {notice.text}
    </p>
  );
}
