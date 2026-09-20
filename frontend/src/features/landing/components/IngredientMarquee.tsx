import { MARQUEE_WORDS } from "@/features/landing/content";

/** Endlessly scrolling row of foods; the list is doubled so the -50% loop is seamless. */
export function IngredientMarquee() {
  const words = [...MARQUEE_WORDS, ...MARQUEE_WORDS];

  return (
    <div className="mt-[84px] overflow-hidden border-y border-white/[0.07] py-[22px] [-webkit-mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <div className="flex w-max animate-fv-marquee gap-12">
        {words.map((word, i) => (
          <div key={i} className="flex shrink-0 items-center gap-12">
            <span className="text-base font-semibold whitespace-nowrap text-slate-600">{word}</span>
            <span className="size-[5px] shrink-0 rounded-full bg-accent" />
          </div>
        ))}
      </div>
    </div>
  );
}
