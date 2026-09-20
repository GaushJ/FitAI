/** A short user-facing status message (form feedback, banners). */
export interface Notice {
  tone: "success" | "error" | "warning";
  text: string;
}
