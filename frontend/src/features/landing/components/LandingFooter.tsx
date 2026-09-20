import { BrandLogo } from "@/components/molecules/BrandLogo";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.07] px-8 py-[34px]">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4">
        <BrandLogo size="sm" />
        <p className="text-[13px] text-[#5E6056]">© 2026 GetFitbro · Log it. Track it. Keep the streak.</p>
      </div>
    </footer>
  );
}
