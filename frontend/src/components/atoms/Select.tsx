import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/** Native <select> styled to match <Input size="md">. */
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full cursor-pointer appearance-none rounded-xs border border-line-strong bg-surface-low py-2.5 pr-10 pl-3 text-sm text-ink focus:border-ink focus:bg-card focus:outline-none",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted" />
    </div>
  );
}
