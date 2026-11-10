import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/atoms/Spinner";

type Variant = "primary" | "dark" | "outline" | "ghost";
type Size = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-hard-primary press-3d hover:bg-primary-bright",
  dark: "bg-ink text-white hover:bg-ink/85",
  outline: "border border-ink bg-card text-ink hover:bg-surface-low",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface-container",
};

// Child <svg> icons are sized by the button so callers just pass <Icon />.
const SIZES: Record<Size, string> = {
  xs: "gap-1 px-2.5 py-1.5 text-[11px] [&>svg]:size-3",
  sm: "gap-1.5 px-3 py-2 text-xs [&>svg]:size-3.5",
  md: "gap-2 px-4 py-2.5 text-sm [&>svg]:size-4",
  lg: "gap-2 px-5 py-3.5 text-base [&>svg]:size-5",
};

const SPINNER_SIZES: Record<Size, string> = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

/** Button styling for non-<button> elements such as Next <Link>s. */
export const buttonClasses = ({
  variant = "primary",
  size = "md",
  fullWidth,
}: { variant?: Variant; size?: Size; fullWidth?: boolean } = {}) =>
  cn(
    "inline-flex cursor-pointer items-center justify-center rounded-xs font-display font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
  );

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Leading icon shown when not loading. */
  icon?: ReactNode;
  /** Swaps the icon for a spinner and disables the button. */
  loading?: boolean;
  /** Replaces the label while loading. When omitted the label is kept. */
  loadingText?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  icon,
  loading,
  loadingText,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {loading ? <Spinner className={SPINNER_SIZES[size]} /> : icon}
      {loading && loadingText !== undefined ? loadingText : children}
    </button>
  );
}
