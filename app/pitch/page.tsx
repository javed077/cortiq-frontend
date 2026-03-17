"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#C8FF00"; const CYAN = "#00E5FF";
const SLIDES_META = [
  { id: "cover", icon: "◎", title: "Cover" }, { id: "problem", icon: "⚠", title: "Problem" },
  { id: "solution", icon: "⬡", title: "Solution" }, { id: "market", icon: "△", title: "Market Size" },
  { id: "traction", icon: "↑", title: "Traction" }, { id: "businessmodel", icon: "◇", title: "Business Model" },
  { id: "competition", icon: "⊕", title: "Competition" }, { id: "team", icon: "○", title: "Team" },
  { id: "financials", icon: "▦", title: "Financials" }, { id: "ask", icon: "★", title: "The Ask" },
];

function SlidePreview({ slide, index, color }: { slide: any; index: number; color: string }) {
  return (
    <div style={{ background: "#0D0D0D", border: `1px solid ${color}20`, borderRadius: 10, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{String(index + 1).padStart(2, "0")}</span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "white" }}>{slide.title}</span>
        </div>
        <span style={{ fontSize: 14, color }}>{SLIDES_META.find(s => s.title === slide.title)?.icon || "◎"}</span>
      </div>
      {slide.content && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
          {(Array.isArray(slide.content) ? slide.content : [slide.content]).slice(0, 3).map((line: string, i: number) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <div style={{ width: 3, height: 3, minWidth: 3, borderRadius: "50%", background: color, marginTop: 5, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{line}</span>
            </div>
          ))}
          {(Array.isArray(slide.content) ? slide.content : []).length > 3 && (
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>+{(slide.content as string[]).length - 3} more</span>
          )}
        </div>
      )}
      {slide.tagline && <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color, marginTop: 6 }}>"{slide.tagline}"</p>}
    </div>
  );
}

export default function PitchPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
  const [slides, setSlides] = useState<any[]>([]); const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false); const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState(""); const [progress, setProgress] = useState(0);
  const [tone, setTone] = useState<"investor" | "customer" | "partner">("investor");
  const [slides_n, setSlidesN] = useState(10);
  const [isMobile, setIsMobile] = useState(false);

  const COLORS = [ACCENT, CYAN, "#FFB800", "#FF6B6B", "#A855F7", ACCENT, CYAN, "#FFB800", "#FF6B6B", "#A855F7"];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const r = localStorage.getItem("cortiq_result"); const f = localStorage.getItem("cortiq_form");
    if (r && f) generateSlides(JSON.parse(r), JSON.parse(f));
  }, []);

  async function generateSlides(cortiqResult?: any, cortiqForm?: any) {
    const r = cortiqResult || JSON.parse(localStorage.getItem("cortiq_result") || "{}");
    const f = cortiqForm || JSON.parse(localStorage.getItem("cortiq_form") || "{}");
    if (!r.result && !r.health_score) { setError("No analysis data — run an analysis first."); return; }
    setLoading(true); setError(""); setProgress(0);
    const progressInterval = setInterval(() => setProgress(p => Math.min(p + 8, 88)), 400);
    try {
      const res = await fetch(`${API}/pitch-deck`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ result: r.result || r, form: f, strategy: r.strategy, marketResearch: r.marketResearch, investorScore: r.investorScore, tone, slides_count: slides_n }) });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json(); setSlides(data.slides || []); setProgress(100);
    } catch { setError("Generation failed. Check the backend is running."); }
    clearInterval(progressInterval); setLoading(false);
  }

  async function downloadPPTX() {
    setGenerating(true); setError("");
    try {
      const r = JSON.parse(localStorage.getItem("cortiq_result") || "{}");
      const f = JSON.parse(localStorage.getItem("cortiq_form") || "{}");
      const res = await fetch(`${API}/pitch-deck/download`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slides, result: r.result || r, form: f }) });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `cortiq-pitch-deck-${Date.now()}.pptx`; a.click(); URL.revokeObjectURL(url);
      setDownloaded(true); setTimeout(() => setDownloaded(false), 4000);
    } catch { setError("Download failed — check backend."); }
    setGenerating(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #050505; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .tag { display:inline-block; padding:3px 10px; background:rgba(200,255,0,0.10); border:1px solid rgba(200,255,0,0.25); border-radius:4px; font-family:'Space Mono',monospace; font-size:9px; color:${ACCENT}; letter-spacing:0.15em; text-transform:uppercase; }
        .back-btn { display:inline-flex; align-items:center; gap:8px; background:none; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); border-radius:10px; padding:12px 16px; cursor:pointer; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.15em; transition:all 0.2s; min-height:48px; -webkit-tap-highlight-color:transparent; }
        .back-btn:hover { border-color:rgba(255,255,255,0.25); color:white; }
        .tone-btn { padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.08em; cursor:pointer; transition:all 0.2s; background:transparent; min-height:48px; -webkit-tap-highlight-color:transparent; flex:1; }
        .primary-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:13px 24px; background:${ACCENT}; color:#050505; font-family:'Space Mono',monospace; font-size:11px; letter-spacing:0.1em; font-weight:700; border-radius:10px; cursor:pointer; border:none; transition:all 0.2s; min-height:52px; -webkit-tap-highlight-color:transparent; }
        .primary-btn:hover { background:#d4ff33; } .primary-btn:disabled { background:#2a2a2a; color:#555; cursor:not-allowed; }
        .secondary-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:13px 24px; background:transparent; color:${ACCENT}; font-family:'Space Mono',monospace; font-size:11px; letter-spacing:0.1em; font-weight:700; border-radius:10px; cursor:pointer; border:1px solid ${ACCENT}; transition:all 0.2s; min-height:52px; -webkit-tap-highlight-color:transparent; }
        .secondary-btn:hover { background:rgba(200,255,0,0.06); }
        .nav-btn { padding:12px 18px; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.1em; border-radius:10px; cursor:pointer; min-height:48px; -webkit-tap-highlight-color:transparent; transition:all 0.2s; }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: isMobile ? "20px 16px" : "40px 24px", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="fade-up" style={{ marginBottom: 32 }}>
            <button className="back-btn" onClick={() => router.push("/")} style={{ marginBottom: 24 }}>← Dashboard</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 16 }}>★</span></div>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>CORTIQ · PITCH DECK</span>
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,5vw,46px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              AI Pitch Deck<br /><span style={{ color: ACCENT }}>Generator</span>
            </h1>
          </div>

          {/* controls */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: isMobile ? "16px" : "24px", marginBottom: 16 }} className="fade-up">
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 20, alignItems: isMobile ? "stretch" : "flex-end" }}>
              <div style={{ flex: isMobile ? undefined : 1 }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>Audience Tone</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["investor", "customer", "partner"] as const).map(t => (
                    <button key={t} className="tone-btn" onClick={() => setTone(t)} style={{ background: tone === t ? ACCENT : "transparent", color: tone === t ? "#050505" : "rgba(255,255,255,0.45)", borderColor: tone === t ? ACCENT : "rgba(255,255,255,0.1)", fontWeight: tone === t ? 700 : 400 }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: isMobile ? undefined : 1 }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>
                  Slides: <span style={{ color: ACCENT }}>{slides_n}</span>
                </div>
                <input type="range" min={6} max={12} value={slides_n} onChange={e => setSlidesN(Number(e.target.value))} style={{ width: "100%", accentColor: ACCENT, height: 24 }} />
              </div>
              <button className="primary-btn" onClick={() => generateSlides()} disabled={loading} style={{ whiteSpace: "nowrap" }}>
                {loading ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#050505", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating...</> : "⬡ Generate Slides"}
              </button>
            </div>
            {loading && (
              <div style={{ marginTop: 16 }}>
                <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: ACCENT, borderRadius: 2, transition: "width 0.4s ease", boxShadow: `0 0 8px ${ACCENT}60` }} />
                </div>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>Crafting {slides_n} slides for {tone} audience…</p>
              </div>
            )}
          </div>

          {error && <div style={{ padding: "12px 16px", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 10, fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#FF6B6B", marginBottom: 16 }}>⚠ {error}</div>}

          {slides.length > 0 && (
            <div className="fade-up">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <span className="tag">{slides.length} Slides</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)", minWidth: 20 }} />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="secondary-btn" onClick={() => generateSlides()} style={{ padding: "10px 16px", fontSize: 10 }}>↻ Regenerate</button>
                  <button className="primary-btn" onClick={downloadPPTX} disabled={generating} style={downloaded ? { background: "#1a3300", color: ACCENT, border: `1px solid ${ACCENT}` } : {}}>
                    {generating ? "Building…" : downloaded ? "✓ Downloaded!" : "⬇ Download .pptx"}
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {slides.map((_: any, i: number) => (
                  <div key={i} style={{ width: 26, height: 26, borderRadius: 6, background: COLORS[i % COLORS.length] + "18", border: `1px solid ${COLORS[i % COLORS.length]}33`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 9, color: COLORS[i % COLORS.length] }}>{i + 1}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
                {slides.map((slide: any, i: number) => <SlidePreview key={i} slide={slide} index={i} color={COLORS[i % COLORS.length]} />)}
              </div>
              <div style={{ marginTop: 20, background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.15)", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "white", marginBottom: 4 }}>Ready for investors?</div>
                  <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Download the fully formatted .pptx with dark theme and speaker notes</p>
                </div>
                <button className="primary-btn" onClick={downloadPPTX} disabled={generating} style={{ whiteSpace: "nowrap" }}>
                  {generating ? "Building…" : "⬇ Download .pptx"}
                </button>
              </div>
            </div>
          )}

          {!slides.length && !loading && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: isMobile ? "40px 20px" : "60px 40px", textAlign: "center" }}>
              <div style={{ fontSize: 36, color: "rgba(255,255,255,0.08)", marginBottom: 14 }}>★</div>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 16 }}>Your pitch deck will appear here after generation</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                {SLIDES_META.slice(0, 5).map(s => (
                  <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: "rgba(200,255,0,0.4)", fontSize: 12 }}>{s.icon}</span>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{s.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

<div
  style={{
    display: "flex",
    gap: 12,
    marginTop: 28,
    justifyContent: "center",
    flexWrap: "wrap",
  }}
>
  <button
    className="secondary-btn"
    onClick={() => router.push("/simulate")}
  >
    ← Back to Simulator
  </button>

  <button
    className="secondary-btn"
    onClick={() => router.push("/")}
  >
    ← Dashboard
  </button>
</div>

          <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>CORTIQ © 2025</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>NOT FINANCIAL ADVICE</span>
          </div>
        </div>
      </main>
    </>
  );
}