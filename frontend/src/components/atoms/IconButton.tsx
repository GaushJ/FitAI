import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "neutral" | "danger" | "outline-accent" | "outline-danger";
type Size = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  neutral: "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100",
  danger: "bg-slate-800 hover:bg-red-900/40 text-slate-500 hover:text-red-400",
  "outline-accent":
    "bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-accent/40 text-slate-600 hover:text-accent",
  "outline-danger":
    "bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-800/60 text-slate-600 hover:text-red-400",
};

const SIZES: Record<Size, string> = {
  xs: "size-5 rounded-md [&>svg]:size-2.5",
  sm: "size-6 rounded-lg [&>svg]:size-3",
  md: "size-7 rounded-lg [&>svg]:size-3.5",
  lg: "size-8 rounded-lg [&>svg]:size-4",
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
        "flex shrink-0 cursor-pointer items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-40",
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
