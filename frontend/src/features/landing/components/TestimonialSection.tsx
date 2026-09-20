import { Reveal } from "@/features/landing/components/Reveal";

function StarRating() {
  return (
    <div className="mb-[22px] flex justify-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={20} height={20} viewBox="0 0 24 24" fill="currentColor" className="text-accent" aria-hidden>
          <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialSection() {
  return (
    <section className="mx-auto max-w-[880px] px-8 pt-10 pb-[110px] max-[640px]:px-5 max-[640px]:pt-8 max-[640px]:pb-16">
      <Reveal>
        <figure className="relative rounded-[26px] border border-white/[0.09] bg-[linear-gradient(160deg,#16180F,#0C0D08)] px-12 py-14 text-center max-[640px]:px-6 max-[640px]:py-9">
          <StarRating />
          <blockquote className="mb-[30px] font-display text-[clamp(18px,2.2vw,28px)] leading-[1.32] font-semibold tracking-[-0.02em] text-slate-100">
            &ldquo;I&apos;ve tried every macro tracker. GetFitbro is the first one I actually use every day —
            because logging <span className="text-accent">takes five seconds</span>.&rdquo;
          </blockquote>
          <figcaption className="flex items-center justify-center gap-3">
            <div className="flex size-[42px] items-center justify-center rounded-full bg-accent text-base font-bold text-ink">
              A
            </div>
            <div className="text-left">
              <p className="text-[15px] font-bold">Aarav M.</p>
              <p className="text-[13px] text-slate-500">Lifts 5x a week · 76-day streak</p>
            </div>
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}
