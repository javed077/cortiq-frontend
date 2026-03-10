"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#C8FF00";
const DIM = "rgba(200,255,0,0.10)";

/* ── animated counter ── */
function Counter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = Math.ceil(target / 35);
    const id = setInterval(() => {
      v += step;
      if (v >= target) { setVal(target); clearInterval(id); }
      else setVal(v);
    }, 20);
    return () => clearInterval(id);
  }, [target]);
  return <>{val}</>;
}

/* ── progress bar ── */
function Bar({ pct, color = ACCENT }: { pct: number; color?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const id = setTimeout(() => setW(pct), 120); return () => clearTimeout(id); }, [pct]);
  return (
    <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}80`, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

/* ── loading screen ── */
function LoadingScreen() {
  const [dots, setDots] = useState(0);
  const steps = ["Parsing startup data", "Generating improvement guide", "Building 12-month roadmap", "Synthesizing strategy"];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const d = setInterval(() => setDots(p => (p + 1) % 4), 400);
    const s = setInterval(() => setStep(p => Math.min(p + 1, steps.length - 1)), 1800);
    return () => { clearInterval(d); clearInterval(s); };
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
      `}</style>

      {/* bg grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none" }} />

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* spinner */}
        <div style={{ width: 64, height: 64, border: "2px solid rgba(255,255,255,0.06)", borderTopColor: ACCENT, borderRadius: "50%", margin: "0 auto 32px", animation: "spin 0.9s linear infinite" }} />

        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: "white", marginBottom: 8 }}>
          Generating Strategy{".".repeat(dots)}
        </h1>

        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 10, maxWidth: 320, margin: "32px auto 0" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i <= step ? 1 : 0.2, transition: "opacity 0.5s" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: i < step ? ACCENT : i === step ? ACCENT : "rgba(255,255,255,0.1)", border: `1px solid ${i <= step ? ACCENT : "rgba(255,255,255,0.1)"}`, flexShrink: 0, boxShadow: i === step ? `0 0 8px ${ACCENT}` : "none", transition: "all 0.4s" }} />
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: i === step ? ACCENT : "rgba(255,255,255,0.4)" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ImprovePage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const [guide, setGuide] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<number | null>(0);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cortiq_result");
    if (!stored) { setLoading(false); return; }
    const data = JSON.parse(stored);
    Promise.all([fetchGuide(data), fetchRoadmap(data)]).finally(() => setLoading(false));
  }, []);

  async function fetchGuide(data: any) {
    try {
      const res = await fetch(`${API}/improvement-guide`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setGuide(await res.json());
    } catch (e) { console.error(e); }
  }

  async function fetchRoadmap(data: any) {
    try {
      const res = await fetch(`${API}/startup-roadmap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setRoadmap(await res.json());
    } catch (e) { console.error(e); }
  }

  if (loading) return <LoadingScreen />;

  const sectionIcons = ["◎", "⬡", "△", "◇", "○", "□"];
  const monthColors = [ACCENT, "#00E5FF", "#FF6B6B", "#FFB800", ACCENT, "#00E5FF", "#FF6B6B", "#FFB800", ACCENT, "#00E5FF", "#FF6B6B", "#FFB800"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050505; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scanline { 0% { transform:translateY(-100%); } 100% { transform:translateY(100vh); } }
        .fade-up { animation: fadeUp 0.45s ease both; }
        .card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          transition: border-color 0.25s;
        }
        .card:hover { border-color: rgba(255,255,255,0.13); }
        .card-active {
          background: rgba(200,255,0,0.04) !important;
          border-color: rgba(200,255,0,0.25) !important;
        }
        .section-btn {
          width: 100%; text-align: left; background: none; border: none; cursor: pointer;
          padding: 20px 24px; display: flex; align-items: center; gap: 14px;
        }
        .section-btn:hover { background: rgba(255,255,255,0.02); border-radius: 14px; }
        .back-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: none; border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5); border-radius: 8px;
          padding: 8px 14px; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em;
          transition: all 0.2s;
        }
        .back-btn:hover { border-color: rgba(255,255,255,0.25); color: white; }
        .tag { display:inline-block; padding:3px 10px; background:${DIM}; border:1px solid ${ACCENT}33; border-radius:4px; font-family:'Space Mono',monospace; font-size:9px; color:${ACCENT}; letter-spacing:0.15em; text-transform:uppercase; }
        .month-card {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          background: rgba(255,255,255,0.02);
        }
        .month-card:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-2px); }
        .month-active { background: rgba(255,255,255,0.03) !important; transform: translateY(-2px); }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: "40px 24px", position: "relative", overflow: "hidden" }}>

        {/* bg grid */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: `linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none" }} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation: "scanline 8s linear infinite", zIndex: 0, pointerEvents: "none" }} />

        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* ── HEADER ── */}
          <div className="fade-up" style={{ marginBottom: 48 }}>
            <button className="back-btn" onClick={() => router.push("/")} style={{ marginBottom: 28 }}>
              ← Back to Analysis
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>⬡</span>
              </div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.35em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                CORTIQ · IMPROVEMENT ENGINE
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: ACCENT, letterSpacing: "0.15em" }}>ACTIVE</span>
              </div>
            </div>

            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4.5vw,48px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              Growth Playbook &<br />
              <span style={{ color: ACCENT }}>12-Month Roadmap</span>
            </h1>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>
              AI-generated improvement strategy · personalized for your startup
            </p>
          </div>

          {/* ── IMPROVEMENT GUIDE ── */}
          {guide?.sections?.length > 0 && (
            <section style={{ marginBottom: 64 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span className="tag">Improvement Guide</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                  {guide.sections.length} sections
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {guide.sections.map((section: any, i: number) => {
                  const open = activeSection === i;
                  return (
                    <div
                      key={i}
                      className={`card fade-up ${open ? "card-active" : ""}`}
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <button className="section-btn" onClick={() => setActiveSection(open ? null : i)}>
                        {/* icon */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: open ? DIM : "rgba(255,255,255,0.04)",
                          border: `1px solid ${open ? ACCENT + "40" : "rgba(255,255,255,0.08)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Space Mono',monospace", fontSize: 14,
                          color: open ? ACCENT : "rgba(255,255,255,0.4)",
                          transition: "all 0.25s",
                        }}>
                          {sectionIcons[i % sectionIcons.length]}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          </div>
                          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: open ? "white" : "rgba(255,255,255,0.85)" }}>
                            {section.title}
                          </h2>
                        </div>

                        {/* chevron */}
                        <div style={{ color: open ? ACCENT : "rgba(255,255,255,0.2)", fontSize: 12, fontFamily: "'Space Mono',monospace", transition: "transform 0.25s, color 0.25s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
                          ▶
                        </div>
                      </button>

                      {/* expanded content */}
                      {open && (
                        <div style={{ padding: "0 24px 24px" }}>
                          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, lineHeight: 1.8, color: "rgba(255,255,255,0.55)", marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            {section.explanation}
                          </p>

                          {section.steps?.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 4 }}>
                                Action Steps
                              </div>
                              {section.steps.map((step: string, si: number) => (
                                <div key={si} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                  <div style={{
                                    width: 20, height: 20, borderRadius: 6,
                                    background: DIM, border: `1px solid ${ACCENT}33`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontFamily: "'Space Mono',monospace", fontSize: 8, color: ACCENT, flexShrink: 0, marginTop: 1,
                                  }}>
                                    {si + 1}
                                  </div>
                                  <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>{step}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── ROADMAP ── */}
          {roadmap?.roadmap?.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <span className="tag">12-Month Roadmap</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
              </div>

              {/* timeline spine on desktop */}
              <div style={{ position: "relative" }}>

                {/* vertical line */}
                <div style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 1, background: "linear-gradient(to bottom, rgba(200,255,0,0.3), rgba(200,255,0,0.05))", display: "none" }} />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
                  {roadmap.roadmap.map((m: any, i: number) => {
                    const color = monthColors[i % monthColors.length];
                    const open = activeMonth === i;

                    return (
                      <div
                        key={i}
                        className={`month-card fade-up ${open ? "month-active" : ""}`}
                        style={{ animationDelay: `${i * 0.04}s`, borderColor: open ? color + "40" : undefined }}
                        onClick={() => setActiveMonth(open ? null : i)}
                      >
                        <div style={{ padding: "18px 20px" }}>
                          {/* month header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: color + "18", border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 9, color, fontWeight: 700 }}>
                                {String(i + 1).padStart(2, "0")}
                              </div>
                              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: "white" }}>{m.month}</h2>
                            </div>
                            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.2)" }}>
                              {open ? "▲" : "▼"}
                            </span>
                          </div>

                          {/* focus badge */}
                          <div style={{ display: "inline-block", padding: "3px 8px", background: color + "18", border: `1px solid ${color}33`, borderRadius: 4, fontFamily: "'Space Mono',monospace", fontSize: 9, color, letterSpacing: "0.08em", marginBottom: 12 }}>
                            {m.focus}
                          </div>

                          {/* progress bar as visual accent */}
                          <Bar pct={((i + 1) / (roadmap.roadmap.length)) * 100} color={color} />

                          {/* tasks — shown when expanded */}
                          {open && m.tasks?.length > 0 && (
                            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 4 }}>Tasks</div>
                              {m.tasks.map((t: string, ti: number) => (
                                <div key={ti} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: color, marginTop: 6, flexShrink: 0 }} />
                                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, lineHeight: 1.65, color: "rgba(255,255,255,0.6)" }}>{t}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* empty state */}
          {!guide && !roadmap && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 32, color: "rgba(255,255,255,0.1)", marginBottom: 16 }}>⬡</div>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No analysis data found.</p>
              <button
                onClick={() => router.push("/")}
                style={{ marginTop: 20, padding: "10px 20px", background: DIM, border: `1px solid ${ACCENT}33`, color: ACCENT, fontFamily: "'Space Mono',monospace", fontSize: 11, borderRadius: 8, cursor: "pointer", letterSpacing: "0.12em" }}
              >
                ← Run an Analysis First
              </button>
            </div>
          )}

          {/* footer */}
          <div style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em" }}>CORTIQ © 2025</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>AI-POWERED · NOT FINANCIAL ADVICE</span>
          </div>

        </div>
      </main>
    </>
  );
}