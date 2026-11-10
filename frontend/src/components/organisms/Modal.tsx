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
  /** Icon element shown before the title. */
  icon?: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  size?: Size;
  /**
   * Cap the panel to the viewport and scroll only the body, keeping the header
   * and `footer` pinned. Use for content of unbounded height.
   */
  contained?: boolean;
  bodyClassName?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function Modal({ title, icon, subtitle, onClose, size = "lg", contained, bodyClassName, footer, children }: ModalProps) {
  const titleId = useId();

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4",
        !contained && "overflow-y-auto",
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "w-full border border-ink bg-card shadow-hard",
          WIDTHS[size],
          contained && "flex max-h-[90vh] flex-col overflow-hidden",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line p-5">
          <div>
            <h3
              id={titleId}
              className="flex items-center gap-2 font-display text-xl font-semibold uppercase tracking-tight text-ink [&>svg]:size-5 [&>svg]:text-primary"
            >
              {icon}
              {title}
            </h3>
            {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X />
          </IconButton>
        </div>

        <div className={cn("p-5", contained && "min-h-0 flex-1 overflow-y-auto", bodyClassName)}>{children}</div>

        {footer && <div className="shrink-0 border-t border-line p-5">{footer}</div>}
      </div>
    </div>
  );
}
