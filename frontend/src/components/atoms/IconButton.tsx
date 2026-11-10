import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "neutral" | "danger" | "outline";
type Size = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  neutral: "text-ink-muted hover:bg-surface-container hover:text-ink",
  danger: "text-ink-muted hover:bg-danger-soft hover:text-danger",
  outline: "border border-line bg-card text-ink-muted hover:border-ink hover:text-ink",
};

const SIZES: Record<Size, string> = {
  xs: "size-6 [&>svg]:size-3",
  sm: "size-7 [&>svg]:size-3.5",
  md: "size-8 [&>svg]:size-4",
  lg: "size-10 [&>svg]:size-5",
};

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  /** Accessible name; also shown as the tooltip. */
  label: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}

export function IconButton({
  label,
  variant = "neutral",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={cn(
        "flex shrink-0 cursor-pointer items-center justify-center rounded-xs transition disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
