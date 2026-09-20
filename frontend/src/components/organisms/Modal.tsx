import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/atoms/IconButton";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const WIDTHS: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

interface ModalProps {
  title: ReactNode;
  /** Coloured icon element shown before the title. */
  icon?: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  size?: Size;
  /** Tighter header for small dialogs. */
  compact?: boolean;
  /**
   * Cap the panel to the viewport and scroll only the body, keeping the header
   * and `footer` pinned. Use for content of unbounded height.
   */
  contained?: boolean;
  bodyClassName?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function Modal({
  title,
  icon,
  subtitle,
  onClose,
  size = "lg",
  compact,
  contained,
  bodyClassName,
  footer,
  children,
}: ModalProps) {
  const titleId = useId();
  const pad = compact ? "p-5" : "p-6";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm",
        !contained && "overflow-y-auto",
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "w-full rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl",
          WIDTHS[size],
          contained && "flex max-h-[90vh] flex-col overflow-hidden",
        )}
      >
        <div className={cn("flex shrink-0 items-center justify-between border-b border-slate-800", pad)}>
          <div>
            <h3
              id={titleId}
              className={cn(
                "flex items-center gap-2 font-bold text-slate-100",
                compact ? "text-base [&>svg]:size-4" : "text-lg [&>svg]:size-5",
              )}
            >
              {icon}
              {title}
            </h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <IconButton label="Close" size="lg" onClick={onClose}>
            <X />
          </IconButton>
        </div>

        <div className={cn(pad, contained && "min-h-0 flex-1 overflow-y-auto", bodyClassName)}>{children}</div>

        {footer && <div className={cn("shrink-0 border-t border-slate-800 pt-3", pad)}>{footer}</div>}
      </div>
    </div>
  );
}
