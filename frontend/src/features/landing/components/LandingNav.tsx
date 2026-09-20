import Link from "next/link";
import { BrandLogo } from "@/components/molecules/BrandLogo";

export function LandingNav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[rgba(11,12,9,0.72)] backdrop-blur-[16px]">
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-8 max-[640px]:px-4">
        <BrandLogo textClassName="max-[380px]:text-[15px]" />
        <div className="flex items-center gap-3.5 max-[380px]:gap-2">
          <Link href="/login" className="px-3 py-2 text-sm font-semibold text-slate-300">
            Sign in
          </Link>
          <Link href="/login" className="rounded-[11px] bg-accent px-[18px] py-2.5 text-sm font-bold text-ink">
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}
