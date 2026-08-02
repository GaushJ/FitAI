"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#C9F24D";
const BG = "#0B0C09";

export default function LandingPage() {
  const router = useRouter();
  const statsRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState({ cal: 0, prot: 0, meals: 0, users: 0 });
  const [started, setStarted] = useState(false);

  // scroll-reveal
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = "1";
          (e.target as HTMLElement).style.transform = "none";
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // counter animation
  useEffect(() => {
    if (!statsRef.current) return;
    const sio = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
          const targets = { cal: 2840, prot: 196, meals: 142000, users: 11800 };
          const dur = 1800;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            setCounts({
              cal:   Math.round(e * targets.cal),
              prot:  Math.round(e * targets.prot),
              meals: Math.round(e * targets.meals),
              users: Math.round(e * targets.users),
            });
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          sio.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    sio.observe(statsRef.current);
    return () => sio.disconnect();
  }, [started]);

  const fmt = (n: number) => n.toLocaleString("en-US");

  const heights = [0.4,0.7,1,0.55,0.85,0.3,0.95,0.6,0.45,0.8,1,0.5,0.7,0.35,0.9,0.6,0.45,0.75,1,0.4,0.65,0.85,0.5,0.3];
  const pal = ["rgba(255,255,255,0.05)","rgba(201,242,77,0.3)","rgba(201,242,77,0.6)","#C9F24D"];
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const heatCells = Array.from({ length: 91 }).map((_, i) => {
    const r = rnd();
    const lvl = r < 0.28 ? 0 : r < 0.45 ? 1 : r < 0.66 ? 2 : 3;
    return <div key={i} style={{ width: "100%", aspectRatio: "1", borderRadius: 3, background: pal[lvl] }} />;
  });

  const words = ["Whey protein","Brown rice","Greek yogurt","Almonds","Chicken breast","Oats","Peanut butter","Eggs","Sweet potato","Banana"];

  return (
    <div style={{ background: BG, color: "#F4F5EF", fontFamily: "'Hanken Grotesk', sans-serif", overflowX: "hidden", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:8px}
        ::-webkit-scrollbar-track{background:#0B0C09}
        ::-webkit-scrollbar-thumb{background:#26281e;border-radius:4px}
        ::selection{background:#C9F24D;color:#0B0C09}
        @keyframes fvUp{from{opacity:0;transform:translateY(34px)}to{opacity:1;transform:none}}
        @keyframes fvWave{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}
        @keyframes fvPulse{0%,100%{box-shadow:0 0 0 0 rgba(201,242,77,0.45)}70%{box-shadow:0 0 0 22px rgba(201,242,77,0)}}
        @keyframes fvFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes fvMarq{to{transform:translateX(-50%)}}
        .fv-h1{animation:fvUp 1s cubic-bezier(.16,1,.3,1) both}
        .fv-d1{animation-delay:.05s}.fv-d2{animation-delay:.18s}.fv-d3{animation-delay:.3s}.fv-d4{animation-delay:.42s}
        [data-reveal]{opacity:0;transform:translateY(40px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}
        .btn-primary{display:inline-flex;align-items:center;gap:9px;background:#C9F24D;border:none;color:#0B0C09;font-size:16px;font-weight:700;cursor:pointer;padding:15px 26px;border-radius:14px;transition:background .15s,transform .1s}
        .btn-primary:hover{background:#d6fb5f;transform:scale(1.02)}
        .btn-ghost{display:inline-flex;align-items:center;gap:9px;background:transparent;border:1px solid rgba(255,255,255,0.16);color:#F4F5EF;font-size:16px;font-weight:600;cursor:pointer;padding:15px 22px;border-radius:14px;transition:border-color .15s}
        .btn-ghost:hover{border-color:rgba(201,242,77,0.5)}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, backdropFilter: "blur(16px)", background: "rgba(11,12,9,0.72)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MicIcon size={16} color={BG} />
            </div>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>FitVoice</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", color: "#C8CABF", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "8px 12px" }}>Sign in</button>
            <button onClick={() => router.push("/login")} style={{ background: ACCENT, border: "none", color: BG, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "10px 18px", borderRadius: 11 }}>Get started</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", padding: "148px 32px 80px", maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", width: 780, height: 520, background: "radial-gradient(ellipse at center,rgba(201,242,77,0.10),transparent 70%)", pointerEvents: "none", filter: "blur(20px)" }} />
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
          <div>
            <div className="fv-h1 fv-d1" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,242,77,0.10)", border: "1px solid rgba(201,242,77,0.28)", borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: ACCENT, letterSpacing: "0.02em", marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: ACCENT, display: "inline-block" }} />
              Voice-first macro tracking
            </div>
            <h1 className="fv-h1 fv-d1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: "clamp(48px,6vw,74px)", lineHeight: 0.96, letterSpacing: "-0.03em", marginBottom: 24 }}>
              Just say<br />what you<br /><span style={{ color: ACCENT }}>ate.</span>
            </h1>
            <p className="fv-h1 fv-d2" style={{ fontSize: 19, lineHeight: 1.55, color: "#A2A498", maxWidth: 440, marginBottom: 36 }}>
              Speak a meal out loud and AI resolves the exact macros — by brand, portion and prep. No searching. No weighing in your head. Just talk.
            </p>
            <div className="fv-h1 fv-d3" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 30 }}>
              <button className="btn-primary" onClick={() => router.push("/login")}>
                Start tracking free <ArrowIcon />
              </button>
              <a href="#how" className="btn-ghost">See how it works</a>
            </div>
            <div className="fv-h1 fv-d4" style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 13, color: "#6E7066", fontWeight: 500 }}>
              <CheckItem label="No credit card" />
              <CheckItem label="Free to start" />
              <CheckItem label="5-second logs" />
            </div>
          </div>

          {/* voice card */}
          <div className="fv-h1 fv-d3" style={{ position: "relative" }}>
            <div style={{ background: "linear-gradient(160deg,#16180F,#0E0F0A)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 26, padding: 28, boxShadow: "0 40px 90px -30px rgba(0,0,0,0.8)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF5E5E", display: "inline-block" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#A2A498" }}>Recording</span>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7066" }}>00:04</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: "fvPulse 2.2s ease-out infinite" }}>
                  <MicIcon size={24} color={BG} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, height: 54, flex: 1 }}>
                  {heights.map((h, i) => (
                    <div key={i} style={{ flex: 1, height: "100%", background: i % 3 === 0 ? ACCENT : "rgba(201,242,77,0.45)", borderRadius: 3, transformOrigin: "center", animation: `fvWave ${0.7 + (i % 5) * 0.12}s ease-in-out ${i * 0.05}s infinite`, transform: `scaleY(${h})` }} />
                  ))}
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E7066", marginBottom: 6 }}>You said</p>
                <p style={{ fontSize: 15, color: "#E8EAE0", lineHeight: 1.4 }}>"Two scrambled eggs, 80 grams of oats and a banana."</p>
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E7066", marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} /> AI resolved
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[["2 eggs · scrambled","156 kcal · 13P"],["Oats · 80g","303 kcal · 11P"],["Banana · 1 medium","105 kcal · 1P"]].map(([l,r]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 13px" }}>
                    <span style={{ fontSize: 14, color: "#E8EAE0" }}>{l}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: ACCENT }}>{r}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize: 13, color: "#8E9085" }}>Total logged</span>
                <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 22, color: "#F4F5EF" }}>564 <span style={{ fontSize: 13, color: "#8E9085", fontWeight: 500 }}>kcal</span></span>
              </div>
            </div>
            <div style={{ position: "absolute", top: -18, right: -14, background: ACCENT, color: BG, fontWeight: 700, fontSize: 13, padding: "9px 15px", borderRadius: 12, boxShadow: "0 14px 30px -8px rgba(201,242,77,0.5)", animation: "fvFloat 5s ease-in-out infinite" }}>⚡ 4.2s</div>
          </div>
        </div>

        {/* marquee */}
        <div style={{ marginTop: 84, borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "22px 0", overflow: "hidden", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)", maskImage: "linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)" }}>
          <div style={{ display: "flex", gap: 48, width: "max-content", animation: "fvMarq 26s linear infinite" }}>
            {[...words, ...words].map((w, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 48, flexShrink: 0 }}>
                <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, fontWeight: 600, color: "#6E7066", whiteSpace: "nowrap" }}>{w}</span>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: "110px 32px", maxWidth: 1240, margin: "0 auto" }}>
        <div data-reveal style={{ textAlign: "center", marginBottom: 72 }}>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: ACCENT, marginBottom: 16 }}>Three steps</p>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "clamp(32px,4vw,54px)", lineHeight: 1.02, letterSpacing: "-0.03em" }}>From spoken to logged<br />in under five seconds.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {[
            { n:"01", t:"Speak your meal",    d:"Tap the mic and say exactly what you ate — brand, quantity, prep. Or just type it.",          path:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" },
            { n:"02", t:"AI resolves macros", d:"The pipeline extracts ingredients, matches your brands and calculates exact macros.",           path:"M12 2a9 9 0 1 0 9 9M12 2v9l6 4" },
            { n:"03", t:"Track & keep streaks",d:"Daily totals, weekly charts and a 90-day heatmap update the instant you log.",              path:"M3 17l6-6 4 4 8-8M21 7v6h-6" },
          ].map((s, i) => (
            <div key={i} data-reveal style={{ background: "linear-gradient(160deg,#17190F,#0C0D08)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 22, padding: "32px 28px", position: "relative", transitionDelay: `${i * 0.1}s` }}>
              <span style={{ position: "absolute", top: 26, right: 28, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 40, color: "rgba(201,242,77,0.13)", lineHeight: 1 }}>{s.n}</span>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(201,242,77,0.12)", border: "1px solid rgba(201,242,77,0.28)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={s.path} /></svg>
              </div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 10, letterSpacing: "-0.01em" }}>{s.t}</h3>
              <p style={{ fontSize: 15, color: "#A2A498", lineHeight: 1.55 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VOICE FEATURE ── */}
      <section style={{ background: "#0E0F0A", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "110px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div data-reveal>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: ACCENT, marginBottom: 16 }}>The voice engine</p>
            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "clamp(28px,3.5vw,48px)", lineHeight: 1.04, letterSpacing: "-0.03em", marginBottom: 22 }}>Talking is faster<br />than typing.</h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: "#A2A498", marginBottom: 32, maxWidth: 460 }}>Real-time transcription captures exactly what you said, then an AI pipeline resolves brands, portion sizes and prep methods into precise macros — filling gaps from the web when it needs to.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                { t:"Brand-aware",    d:"Knows your usual whey, your rice, your peanut butter." },
                { t:"Portion smart",  d:'"A handful", "80 grams", "one medium" — all understood.' },
                { t:"Fills the gaps", d:"Pulls missing nutrition data from the web automatically." },
              ].map((p) => (
                <div key={p.t} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{p.t}</p>
                    <p style={{ fontSize: 14, color: "#8E9085", lineHeight: 1.45 }}>{p.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div data-reveal style={{ transitionDelay: "0.12s" }}>
            <div style={{ background: "linear-gradient(160deg,#17190F,#0C0D08)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, padding: 30 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(201,242,77,0.12)", border: "1px solid rgba(201,242,77,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MicIcon size={20} color={ACCENT} />
                </div>
                <div><p style={{ fontWeight: 700, fontSize: 15 }}>Live transcription</p><p style={{ fontSize: 13, color: "#8E9085" }}>Near-zero latency</p></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {["Captures your speech as you talk","Splits the meal into ingredients","Matches your preferred brands automatically"].map((t, i) => (
                  <React.Fragment key={i}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#6E7066", paddingTop: 2 }}>0{i+1}</span>
                      <p style={{ fontSize: 15, color: "#C8CABF", lineHeight: 1.4 }}>{t}</p>
                    </div>
                    {i < 2 && <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />}
                  </React.Fragment>
                ))}
                <div style={{ background: "rgba(201,242,77,0.07)", border: "1px solid rgba(201,242,77,0.2)", borderRadius: 13, padding: 14, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>Macros resolved</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: ACCENT }}>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STREAK HEATMAP ── */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "110px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
        <div data-reveal>
          <div style={{ background: "linear-gradient(160deg,#17190F,#0C0D08)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div><p style={{ fontWeight: 700, fontSize: 15 }}>90-day overview</p><p style={{ fontSize: 13, color: "#8E9085" }}>Every day you hit your goal</p></div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,138,76,0.12)", border: "1px solid rgba(255,138,76,0.28)", borderRadius: 100, padding: "6px 13px" }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="#FF8A4C"><path d="M12 2c1 3-1 5-1 7a3 3 0 0 0 6 0c0-1 0-2-1-3 2 1 4 4 4 8a8 8 0 0 1-16 0c0-4 4-7 5-9 1 2 2 2 3-3Z" /></svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#FF8A4C" }}>12-day streak</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateRows: "repeat(7,1fr)", gridAutoFlow: "column", gap: 5, marginBottom: 18 }}>{heatCells}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7, fontSize: 11, color: "#6E7066", marginBottom: 20 }}>
              Less {pal.map((c,i)=><span key={i} style={{ width:12,height:12,borderRadius:3,background:c }} />)} More
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[["12","#FF8A4C","Current streak"],["28",ACCENT,"Best streak"],["76","#F4F5EF","Days logged"]].map(([v,c,l])=>(
                <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 14, textAlign: "center" }}>
                  <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 26, color: c }}>{v}</p>
                  <p style={{ fontSize: 11, color: "#8E9085", marginTop: 2 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div data-reveal style={{ transitionDelay: "0.12s" }}>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: ACCENT, marginBottom: 16 }}>Streaks</p>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "clamp(28px,3.5vw,48px)", lineHeight: 1.04, letterSpacing: "-0.03em", marginBottom: 22 }}>Consistency you<br />can actually see.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "#A2A498", maxWidth: 440, marginBottom: 30 }}>A GitHub-style heatmap turns every logged day into a square. Watch the grid fill, keep the streak alive, and let the satisfying chain of green do the motivating for you.</p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 20px" }}>
              <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 30, color: ACCENT }}>23</p>
              <p style={{ fontSize: 13, color: "#8E9085" }}>Avg streak length</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 20px" }}>
              <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 30, color: "#F4F5EF" }}>71<span style={{ fontSize: 18, color: "#8E9085" }}>%</span></p>
              <p style={{ fontSize: 13, color: "#8E9085" }}>Stick past week one</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ maxWidth: 1240, margin: "0 auto", padding: "110px 32px" }}>
        <div data-reveal style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: ACCENT, marginBottom: 16 }}>By the numbers</p>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "clamp(28px,4vw,54px)", lineHeight: 1.02, letterSpacing: "-0.03em" }}>Precision that adds up.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {[
            { val: fmt(counts.cal),   color: ACCENT,    label: "Avg daily calories tracked" },
            { val: fmt(counts.prot)+"g", color:"#F4F5EF", label: "Avg protein logged / day" },
            { val: fmt(counts.meals)+"+", color:"#F4F5EF",label: "Meals resolved by AI" },
            { val: fmt(counts.users)+"+", color: ACCENT,  label: "Active trackers" },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "30px 26px" }}>
              <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 46, color: s.color, letterSpacing: "-0.02em" }}>{s.val}</p>
              <p style={{ fontSize: 14, color: "#8E9085", marginTop: 6 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section style={{ maxWidth: 880, margin: "0 auto", padding: "40px 32px 110px" }}>
        <div data-reveal style={{ background: "linear-gradient(160deg,#16180F,#0C0D08)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 26, padding: "56px 48px", textAlign: "center", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 22 }}>
            {Array.from({length:5}).map((_,i)=>(
              <svg key={i} width={20} height={20} viewBox="0 0 24 24" fill={ACCENT}><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" /></svg>
            ))}
          </div>
          <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: "clamp(18px,2.2vw,28px)", lineHeight: 1.32, letterSpacing: "-0.02em", color: "#F4F5EF", marginBottom: 30 }}>
            "I've tried every macro tracker. FitVoice is the first one I actually use every day — because I just <span style={{ color: ACCENT }}>talk</span> to it."
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: ACCENT, color: BG, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>A</div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 700, fontSize: 15 }}>Aarav M.</p>
              <p style={{ fontSize: 13, color: "#8E9085" }}>Lifts 5x a week · 76-day streak</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: "relative", padding: "120px 32px", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 900, height: 440, background: "radial-gradient(ellipse at center,rgba(201,242,77,0.12),transparent 70%)", pointerEvents: "none", filter: "blur(20px)" }} />
        <div data-reveal style={{ position: "relative", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "clamp(36px,5vw,68px)", lineHeight: 0.98, letterSpacing: "-0.03em", marginBottom: 24 }}>
            Your macros,<br /><span style={{ color: ACCENT }}>resolved.</span>
          </h2>
          <p style={{ fontSize: 19, color: "#A2A498", marginBottom: 38, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>Speak a meal and see exact macros in under five seconds. Free to start, no setup required.</p>
          <button className="btn-primary" style={{ fontSize: 17, padding: "18px 34px", borderRadius: 15 }} onClick={() => router.push("/login")}>
            Start tracking free <ArrowIcon size={19} />
          </button>
          <p style={{ fontSize: 14, color: "#6E7066", marginTop: 18 }}>
            Already have an account?{" "}
            <span style={{ color: ACCENT, cursor: "pointer", fontWeight: 600 }} onClick={() => router.push("/login")}>Sign in →</span>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "34px 32px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MicIcon size={14} color={BG} />
            </div>
            <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 15 }}>FitVoice</span>
          </div>
          <p style={{ fontSize: 13, color: "#5E6056" }}>© 2026 FitVoice · Speak it. Track it. Keep the streak.</p>
        </div>
      </footer>
    </div>
  );
}

// ── Inline SVG helpers ────────────────────────────────────────────────────────

function MicIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function ArrowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function CheckItem({ label }: { label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#C9F24D" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {label}
    </span>
  );
}
