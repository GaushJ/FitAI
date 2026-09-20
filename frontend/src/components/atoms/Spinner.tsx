import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface SpinnerProps {
  /** Tailwind size classes, e.g. "w-4 h-4". */
  className?: string;
}

export function Spinner({ className = "w-4 h-4" }: SpinnerProps) {
  return <Loader2 aria-hidden className={cn("animate-spin", className)} />;
}
