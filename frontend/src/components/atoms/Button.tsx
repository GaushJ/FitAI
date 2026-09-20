import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/atoms/Spinner";

type Variant = "primary" | "secondary" | "ghost" | "success" | "warning";
type Size = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent hover:bg-accent-light text-ink",
  secondary: "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100",
  ghost: "text-slate-400 hover:text-slate-200",
  success: "bg-emerald-600 hover:bg-emerald-500 text-white",
  warning: "bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white",
};

// Child <svg> icons are sized by the button so callers just pass <Icon />.
const SIZES: Record<Size, string> = {
  xs: "gap-1 rounded-lg px-2.5 py-1.5 text-[10px] [&>svg]:size-3",
  sm: "gap-1.5 rounded-lg px-3 py-1.5 text-xs [&>svg]:size-3.5",
  md: "gap-2 rounded-xl px-4 py-2.5 text-xs [&>svg]:size-4",
  lg: "gap-2 rounded-[14px] px-4 py-3.5 text-sm [&>svg]:size-4",
};

const SPINNER_SIZES: Record<Size, string> = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-4",
};

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
      className={cn(
        "inline-flex cursor-pointer items-center justify-center font-bold transition disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner className={SPINNER_SIZES[size]} /> : icon}
      {loading && loadingText !== undefined ? loadingText : children}
    </button>
  );
}
