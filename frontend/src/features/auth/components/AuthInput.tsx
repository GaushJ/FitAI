import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  iconClassName?: string;
  /** Element docked at the right edge (e.g. a show/hide toggle). */
  trailing?: ReactNode;
  invalid?: boolean;
}

/** Large text field with a leading icon, used on the login / signup screen. */
export function AuthInput({
  icon: Icon,
  iconClassName = "text-slate-500",
  trailing,
  invalid,
  className,
  ...rest
}: AuthInputProps) {
  return (
    <div className="relative">
      <Icon
        aria-hidden
        className={cn("pointer-events-none absolute top-1/2 left-3 size-[15px] -translate-y-1/2", iconClassName)}
      />
      <input
        className={cn(
          "w-full rounded-xl border bg-ink py-3 pr-4 pl-10 text-sm text-slate-100 transition placeholder:text-slate-600 focus:ring-1 focus:outline-none",
          invalid
            ? "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20"
            : "border-white/[0.09] focus:border-accent/60 focus:ring-accent/20",
          trailing !== undefined && "pr-10",
          className,
        )}
        {...rest}
      />
      {trailing}
    </div>
  );
}
