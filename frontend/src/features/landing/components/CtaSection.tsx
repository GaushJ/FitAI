import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingLink } from "@/features/landing/components/LandingLink";
import { Reveal } from "@/features/landing/components/Reveal";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden px-8 py-[120px] max-[640px]:px-5 max-[640px]:py-[72px]">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[440px] w-[900px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(201,242,77,0.12),transparent_70%)] blur-[20px]" />

      <Reveal className="relative mx-auto max-w-[720px] text-center">
        <h2 className="mb-6 font-display text-[clamp(36px,5vw,68px)] leading-[0.98] font-extrabold tracking-[-0.03em]">
          Your macros,
          <br />
          <span className="text-accent">resolved.</span>
        </h2>
        <p className="mx-auto mb-[38px] max-w-[480px] text-[19px] text-slate-400">
          Log a meal and see exact macros in under five seconds. Free to start, no setup required.
        </p>
        <LandingLink href="/login" variant="primary" className="rounded-[15px] px-[34px] py-[18px] text-[17px]">
          Start tracking free <ArrowRight size={19} strokeWidth={2.5} />
        </LandingLink>
        <p className="mt-[18px] text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent">
            Sign in →
          </Link>
        </p>
      </Reveal>
    </section>
  );
}
