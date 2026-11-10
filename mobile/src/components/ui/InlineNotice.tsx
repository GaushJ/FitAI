import { Text } from "react-native";
import type { Notice } from "@/types/notice";

const TONES = { success: "text-success", error: "text-danger", warning: "text-warning" } as const;

/** One-line coloured status text for tight spaces (inline edit forms). */
export function InlineNotice({ notice }: { notice: Notice }) {
  return <Text className={`flex-1 font-sans-medium text-xs ${TONES[notice.tone]}`}>{notice.text}</Text>;
}
