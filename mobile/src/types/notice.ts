/** A one-off status message shown in a form or banner (same shape as web's `types/notice.ts`). */
export interface Notice {
  tone: "success" | "error" | "warning";
  text: string;
}
