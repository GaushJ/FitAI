import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Size = "xs" | "sm" | "md" | "lg";
type Surface = "base" | "raised";
type Focus = "accent" | "amber";

const SIZES: Record<Size, string> = {
  xs: "rounded-lg px-1.5 py-1 text-xs",
  sm: "rounded-lg px-2 py-1.5 text-xs",
  md: "rounded-xl px-3 py-2.5 text-xs",
  lg: "rounded-xl px-4 py-2.5 text-xs",
};

// "raised" is for inputs sitting on an already-dark panel.
const SURFACES: Record<Surface, string> = {
  base: "bg-slate-950 border-slate-800",
  raised: "bg-slate-900 border-slate-700",
};

const FOCUS: Record<Focus, string> = {
  accent: "focus:border-accent",
  amber: "focus:border-amber-500",
};

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: Size;
  surface?: Surface;
  focusTone?: Focus;
}

export function Input({
  size = "md",
  surface = "base",
  focusTone = "accent",
  className,
  ...rest
}: InputProps) {
  return (
    <input
      className={cn(
        "w-full border text-slate-100 placeholder:text-slate-600 focus:outline-none",
        SIZES[size],
        SURFACES[surface],
        FOCUS[focusTone],
        className,
      )}
      {...rest}
    />
  );
}
