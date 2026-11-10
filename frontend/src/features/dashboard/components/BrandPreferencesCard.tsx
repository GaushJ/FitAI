import Link from "next/link";
import { FileSpreadsheet, Pencil, ScanLine, Tags } from "lucide-react";
import { Card } from "@/components/atoms/Card";
import { Badge } from "@/components/atoms/Badge";

const METHODS = [
  { label: "By name", icon: Pencil },
  { label: "Label photo", icon: ScanLine },
  { label: "Excel sync", icon: FileSpreadsheet },
];

/** Dashboard shortcut into the Brand Preferences page. */
export function BrandPreferencesCard({ count }: { count: number }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold uppercase tracking-tight text-ink">
          <Tags className="size-5 text-primary" /> Brand preferences
        </h2>
        <Badge tone="muted">{count} saved</Badge>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Your saved brands are applied automatically when an ingredient is logged without one.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {METHODS.map(({ label, icon: Icon }) => (
          <Link
            key={label}
            href="/brand-preferences"
            className="flex flex-col items-center gap-1.5 border border-line bg-surface-low px-2 py-3 text-center font-mono text-[11px] text-ink-muted transition hover:border-ink hover:text-ink"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </div>
    </Card>
  );
}
