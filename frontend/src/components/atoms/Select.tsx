import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/** Native <select> styled to match <Input size="lg">. */
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full cursor-pointer appearance-none rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-9 pl-4 text-xs text-slate-100 focus:border-accent focus:outline-none",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}
