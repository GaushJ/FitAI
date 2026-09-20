import type { ReactNode } from "react";
import { AlertCircle, Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Notice } from "@/types/notice";

const TONES = {
  error: {
    box: "bg-red-950/30 border-red-500/20 text-red-300",
    icon: "text-red-500",
    dismiss: "text-red-400 hover:text-red-200",
  },
  success: {
    box: "bg-emerald-950/30 border-emerald-500/20 text-emerald-300",
    icon: "text-emerald-500",
    dismiss: "text-emerald-400 hover:text-emerald-200",
  },
  warning: {
    box: "bg-amber-950/30 border-amber-500/20 text-amber-200",
    icon: "text-amber-400",
    dismiss: "text-amber-300 hover:text-amber-100",
  },
} as const;

const ICONS = { error: AlertCircle, success: Check, warning: TriangleAlert } as const;

interface AlertProps {
  tone: Notice["tone"];
  /** "lg" is the full-width page banner, "md" a compact in-form message. */
  size?: "md" | "lg";
  onDismiss?: () => void;
  children: ReactNode;
}

export function Alert({ tone, size = "md", onDismiss, children }: AlertProps) {
  const styles = TONES[tone];
  const Icon = ICONS[tone];
  const isBanner = size === "lg";

  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={cn(
        "flex gap-2 rounded-xl border",
        styles.box,
        isBanner ? "items-center gap-3 p-4 text-sm shadow-lg backdrop-blur-sm" : "items-start p-3 text-xs",
      )}
    >
      <Icon
        className={cn("shrink-0", styles.icon, isBanner ? "h-5 w-5" : "mt-0.5 h-4 w-4")}
      />
      <span className={cn("flex-1", isBanner && tone === "success" && "font-medium")}>{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={cn("cursor-pointer px-2 font-semibold", styles.dismiss)}
        >
          ×
        </button>
      )}
    </div>
  );
}
