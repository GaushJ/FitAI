import type { ReactNode } from "react";
import { AlertCircle, Check, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Notice } from "@/types/notice";

const TONES = {
  error: { box: "border-danger bg-danger-soft text-danger", icon: AlertCircle },
  success: { box: "border-success bg-success-soft text-success", icon: Check },
  warning: { box: "border-warning bg-warning-soft text-warning", icon: TriangleAlert },
} as const;

interface AlertProps {
  tone: Notice["tone"];
  /** "lg" is the full-width page banner, "md" a compact in-form message. */
  size?: "md" | "lg";
  onDismiss?: () => void;
  children: ReactNode;
}

export function Alert({ tone, size = "md", onDismiss, children }: AlertProps) {
  const { box, icon: Icon } = TONES[tone];
  const isBanner = size === "lg";

  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={cn(
        "flex gap-2.5 rounded-xs border-l-4",
        box,
        isBanner ? "items-center p-4 text-sm" : "items-start p-3 text-xs",
      )}
    >
      <Icon className={cn("shrink-0", isBanner ? "size-5" : "mt-px size-4")} />
      <span className="flex-1 font-medium">{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="cursor-pointer opacity-70 hover:opacity-100">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
