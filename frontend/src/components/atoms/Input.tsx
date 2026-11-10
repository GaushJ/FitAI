import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Size = "xs" | "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-3 py-2.5 text-sm",
  lg: "px-4 py-3 text-base",
};

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: Size;
  invalid?: boolean;
}

export function Input({ size = "md", invalid, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full rounded-xs border bg-surface-low text-ink placeholder:text-ink-subtle focus:bg-card focus:outline-none",
        invalid ? "border-danger focus:border-danger" : "border-line-strong focus:border-ink",
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}
