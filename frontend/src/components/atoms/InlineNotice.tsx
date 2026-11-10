import { cn } from "@/lib/cn";
import type { Notice } from "@/types/notice";

const TONES = { success: "text-success", error: "text-danger", warning: "text-warning" } as const;

/** One-line coloured status text for tight spaces (inline edit forms). */
export function InlineNotice({ notice }: { notice: Notice }) {
  return <p className={cn("text-xs font-medium", TONES[notice.tone])}>{notice.text}</p>;
}
