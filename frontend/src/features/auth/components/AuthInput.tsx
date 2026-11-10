import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  /** Element docked at the right edge (e.g. a show/hide toggle). */
  trailing?: ReactNode;
  invalid?: boolean;
}

/** Large text field with a leading icon, used on the login / signup screen. */
export function AuthInput({ icon: Icon, trailing, invalid, className, ...rest }: AuthInputProps) {
  return (
    <div className="relative">
      <Icon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" />
      <input
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full rounded-xs border bg-surface-low py-3 pr-4 pl-10 text-base text-ink transition placeholder:text-ink-subtle focus:bg-card focus:outline-none",
          invalid ? "border-danger" : "border-line-strong focus:border-ink",
          trailing !== undefined && "pr-11",
          className,
        )}
        {...rest}
      />
      {trailing}
    </div>
  );
}
