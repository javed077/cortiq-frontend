"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#C8FF00";
const CYAN   = "#00E5FF";

const SLIDES_META = [
  { id: "cover",       icon: "◎", title: "Cover",            desc: "Company name, tagline, and founding date" },
  { id: "problem",     icon: "⚠", title: "Problem",          desc: "The pain you're solving and why it matters now" },
  { id: "solution",    icon: "⬡", title: "Solution",         desc: "Your product and unique approach" },
  { id: "market",      icon: "△", title: "Market Size",      desc: "TAM, SAM, SOM with growth trajectory" },
  { id: "traction",    icon: "↑", title: "Traction",         desc: "Revenue, users, key milestones achieved" },
  { id: "businessmodel", icon: "◇", title: "Business Model", desc: "How you make money and unit economics" },
  { id: "competition", icon: "⊕", title: "Competition",      desc: "Competitive landscape and your moat" },
  { id: "team",        icon: "○", title: "Team",             desc: "Founders and key hires" },
  { id: "financials",  icon: "▦", title: "Financials",       desc: "Runway, burn rate, path to profitability" },
  { id: "ask",         icon: "★", title: "The Ask",          desc: "Raise amount, use of funds, milestones" },
];

function SlidePreview({ slide, index, color }: { slide: any; index: number; color: string }) {
  return (
    <div style={{
      background: "#0D0D0D", border: `1px solid ${color}20`,
      borderRadius: 10, padding: "14px 16px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "white" }}>
            {slide.title}
          </span>
        </div>
        <span style={{ fontSize: 14, color }}>
          {SLIDES_META.find(s => s.title === slide.title)?.icon || "◎"}
        </span>
      </div>
      {slide.content && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
          {(Array.isArray(slide.content) ? slide.content : [slide.content]).slice(0, 3).map((line: string, i: number) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: color, marginTop: 5, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{line}</span>
            </div>
          ))}
          {(Array.isArray(slide.content) ? slide.content : []).length > 3 && (
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
              +{(slide.content as string[]).length - 3} more points
            </span>
          )}
        </div>
      )}
      {slide.tagline && (
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color, marginTop: 6 }}>
          "{slide.tagline}"
        </p>
      )}
    </div>
  );
}

export default function PitchPage() {
  const router = useRouter();
  const API    = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const [slides,     setSlides]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error,      setError]      = useState("");
  const [progress,   setProgress]   = useState(0);

  // form state for customisation
  const [tone,    setTone]    = useState<"investor"|"customer"|"partner">("investor");
  const [slides_n,setSlidesN] = useState(10);

  const COLORS = [ACCENT, CYAN, "#FFB800", "#FF6B6B", "#A855F7",
                  ACCENT, CYAN, "#FFB800", "#FF6B6B", "#A855F7"];

  useEffect(() => {
    // auto-generate on mount if data exists
    const r = localStorage.getItem("cortiq_result");
    const f = localStorage.getItem("cortiq_form");
    if (r && f) generateSlides(JSON.parse(r), JSON.parse(f));
  }, []);

  async function generateSlides(cortiqResult?: any, cortiqForm?: any) {
    const r = cortiqResult || JSON.parse(localStorage.getItem("cortiq_result") || "{}");
    const f = cortiqForm   || JSON.parse(localStorage.getItem("cortiq_form")   || "{}");

    if (!r.result && !r.health_score) {
      setError("No analysis data — run an analysis first.");
      return;
    }

    setLoading(true);
    setError("");
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 8, 88));
    }, 400);

    try {
      const res = await fetch(`${API}/pitch-deck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: r.result || r, form: f, strategy: r.strategy, marketResearch: r.marketResearch, investorScore: r.investorScore, tone, slides_count: slides_n }),
      });

      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setSlides(data.slides || []);
      setProgress(100);
    } catch (e) {
      setError("Generation failed. Check the backend is running.");
    }

    clearInterval(progressInterval);
    setLoading(false);
  }

  async function downloadPPTX() {
    setGenerating(true);
    setError("");
    try {
      const r = JSON.parse(localStorage.getItem("cortiq_result") || "{}");
      const f = JSON.parse(localStorage.getItem("cortiq_form")   || "{}");

      const res = await fetch(`${API}/pitch-deck/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides, result: r.result || r, form: f }),
      });

      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `cortiq-pitch-deck-${Date.now()}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 4000);
    } catch {
      setError("Download failed — check backend.");
    }
    setGenerating(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050505; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scanline { 0% { transform:translateY(-100%); } 100% { transform:translateY(100vh); } }
        @keyframes spin     { to { transform:rotate(360deg); } }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .tag { display:inline-block; padding:3px 10px; background:rgba(200,255,0,0.10); border:1px solid rgba(200,255,0,0.25); border-radius:4px; font-family:'Space Mono',monospace; font-size:9px; color:${ACCENT}; letter-spacing:0.15em; text-transform:uppercase; }
        .back-btn { display:inline-flex; align-items:center; gap:8px; background:none; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); border-radius:8px; padding:8px 14px; cursor:pointer; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.15em; transition:all 0.2s; }
        .back-btn:hover { border-color:rgba(255,255,255,0.25); color:white; }
        .tone-btn { padding:8px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.1em; cursor:pointer; transition:all 0.2s; background:transparent; }
        .primary-btn { display:inline-flex; align-items:center; gap:8px; padding:13px 28px; background:${ACCENT}; color:#050505; font-family:'Space Mono',monospace; font-size:11px; letter-spacing:0.12em; font-weight:700; border-radius:10px; cursor:pointer; border:none; transition:all 0.2s; }
        .primary-btn:hover { background:#d4ff33; transform:translateY(-1px); }
        .primary-btn:disabled { background:#2a2a2a; color:#555; cursor:not-allowed; transform:none; }
        .secondary-btn { display:inline-flex; align-items:center; gap:8px; padding:13px 28px; background:transparent; color:${ACCENT}; font-family:'Space Mono',monospace; font-size:11px; letter-spacing:0.12em; font-weight:700; border-radius:10px; cursor:pointer; border:1px solid ${ACCENT}; transition:all 0.2s; }
        .secondary-btn:hover { background:rgba(200,255,0,0.06); }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: "40px 24px", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* header */}
          <div className="fade-up" style={{ marginBottom: 40 }}>
            <button className="back-btn" onClick={() => router.push("/")} style={{ marginBottom: 28 }}>← Dashboard</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>★</span>
              </div>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>CORTIQ · PITCH DECK GENERATOR</span>
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              AI Pitch Deck<br /><span style={{ color: ACCENT }}>Generator</span>
            </h1>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
              Turn your analysis into a VC-ready pitch deck in seconds
            </p>
          </div>

          {/* controls */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24, marginBottom: 20 }} className="fade-up">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-end" }}>

              {/* tone */}
              <div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>Audience Tone</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["investor", "customer", "partner"] as const).map(t => (
                    <button key={t} className="tone-btn" onClick={() => setTone(t)}
                      style={{ background: tone === t ? ACCENT : "transparent", color: tone === t ? "#050505" : "rgba(255,255,255,0.45)", borderColor: tone === t ? ACCENT : "rgba(255,255,255,0.1)", fontWeight: tone === t ? 700 : 400 }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* slide count */}
              <div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>
                  Slides: <span style={{ color: ACCENT }}>{slides_n}</span>
                </div>
                <input type="range" min={6} max={12} value={slides_n} onChange={e => setSlidesN(Number(e.target.value))}
                  style={{ width: 140, accentColor: ACCENT }} />
              </div>

              <button className="primary-btn" onClick={() => generateSlides()} disabled={loading} style={{ marginLeft: "auto" }}>
                {loading
                  ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#050505", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating...</>
                  : "⬡  Generate Slides"}
              </button>
            </div>

            {/* progress */}
            {loading && (
              <div style={{ marginTop: 16 }}>
                <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: ACCENT, borderRadius: 2, transition: "width 0.4s ease", boxShadow: `0 0 8px ${ACCENT}60` }} />
                </div>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                  Crafting {slides_n} slides for {tone} audience…
                </p>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 10, fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#FF6B6B", marginBottom: 16 }}>
              ⚠ {error}
            </div>
          )}

          {/* slides grid */}
          {slides.length > 0 && (
            <div className="fade-up">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span className="tag">{slides.length} Slides Generated</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="secondary-btn" onClick={() => generateSlides()}>↻ Regenerate</button>
                  <button className="primary-btn" onClick={downloadPPTX} disabled={generating}
                    style={downloaded ? { background: "#1a3300", color: ACCENT, border: `1px solid ${ACCENT}` } : {}}>
                    {generating ? "Building PPTX…" : downloaded ? "✓ Downloaded!" : "⬇  Download .pptx"}
                  </button>
                </div>
              </div>

              {/* slide strip legend */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {slides.map((s: any, i: number) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: 6, background: COLORS[i % COLORS.length] + "18", border: `1px solid ${COLORS[i % COLORS.length]}33`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 9, color: COLORS[i % COLORS.length] }}>
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* slides grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                {slides.map((slide: any, i: number) => (
                  <SlidePreview key={i} slide={slide} index={i} color={COLORS[i % COLORS.length]} />
                ))}
              </div>

              {/* download CTA */}
              <div style={{ marginTop: 24, background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.15)", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "white", marginBottom: 4 }}>
                    Ready for investors?
                  </div>
                  <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                    Download the fully formatted .pptx deck with dark theme, charts, and speaker notes
                  </p>
                </div>
                <button className="primary-btn" onClick={downloadPPTX} disabled={generating}>
                  {generating ? "Building…" : "⬇  Download .pptx"}
                </button>
              </div>
            </div>
          )}

          {/* empty state */}
          {!slides.length && !loading && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
              <div style={{ fontSize: 40, color: "rgba(255,255,255,0.08)", marginBottom: 16 }}>★</div>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 20 }}>
                Your pitch deck will appear here after generation
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
                {SLIDES_META.slice(0, 5).map(s => (
                  <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "rgba(200,255,0,0.4)", fontSize: 12 }}>{s.icon}</span>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{s.title}</span>
                  </div>
                ))}
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>+ more</span>
              </div>
            </div>
          )}

          {/* nav links */}
          <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "center" }}>
            <button onClick={() => router.push("/simulate")}
              style={{ padding: "11px 22px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: "0.12em", borderRadius: 10, cursor: "pointer" }}>
              ← Burn Simulator
            </button>
            <button onClick={() => router.push("/export")}
              style={{ padding: "11px 22px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: "0.12em", borderRadius: 10, cursor: "pointer" }}>
              ← Export PDF
            </button>
          </div>

          <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em" }}>CORTIQ © 2025</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>NOT FINANCIAL ADVICE</span>
          </div>

        </div>
      </main>
    </>
  );
}