"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LIME = "#C8FF00";
const LIME_DIM = "rgba(200,255,0,0.12)";

/* ─── Animated progress bar ─── */
function Bar({ pct, color = LIME }: { pct: number; color?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setW(pct), 180);
    return () => clearTimeout(id);
  }, [pct]);
  return (
    <div style={{ width: "100%", height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 1, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${w}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 1,
          transition: "width 1.2s cubic-bezier(.22,1,.36,1)",
        }}
      />
    </div>
  );
}

/* ─── Loading screen ─── */
function LoadingScreen() {
  const [tick, setTick] = useState(0);
  const steps = ["Parsing startup data", "Generating improvement guide", "Building 12-month roadmap", "Synthesizing strategy"];
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(id);
  }, []);
  const step = Math.min(tick, steps.length - 1);

  return (
    <main style={{ minHeight: "100vh", background: "#060606", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{CSS}</style>
      <div style={{ textAlign: "center", padding: "0 24px" }}>
        {/* Pulsing orb */}
        <div style={{ width: 72, height: 72, margin: "0 auto 36px", position: "relative" }}>
          <div className="orb-ring" />
          <div style={{ position: "absolute", inset: 14, borderRadius: "50%", background: LIME_DIM, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: LIME }} />
          </div>
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "clamp(22px,5vw,30px)", fontWeight: 400, color: "white", letterSpacing: "-0.01em", marginBottom: 32 }}>
          Generating your strategy
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 240, margin: "0 auto" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i <= step ? 1 : 0.2, transition: "opacity 0.5s" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: i < step ? LIME : i === step ? LIME : "rgba(255,255,255,0.2)", boxShadow: i === step ? `0 0 8px ${LIME}` : "none", transition: "all 0.4s" }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: i === step ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)", letterSpacing: "0.03em" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

/* ─── Main page ─── */
export default function ImprovePage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "";
  const [guide, setGuide] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<number | null>(0);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [tab, setTab] = useState<"guide" | "roadmap">("guide");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
    } catch {}
  }
  async function fetchRoadmap(data: any) {
    try {
      const res = await fetch(`${API}/startup-roadmap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setRoadmap(await res.json());
    } catch {}
  }

  if (loading) return <LoadingScreen />;

  const MONTH_PALETTE = [LIME, "#38BDF8", "#F472B6", "#FB923C", "#A78BFA", "#34D399", LIME, "#38BDF8", "#F472B6", "#FB923C", "#A78BFA", "#34D399"];

  /* ─── icons as tiny SVG strings ─── */
  const SECTION_SYMBOLS = ["⬡", "◎", "△", "◇", "○", "□"];

  return (
    <>
      <style>{CSS}</style>
      <main style={{ minHeight: "100vh", background: "#060606", color: "white", position: "relative", overflowX: "hidden" }}>

        {/* Subtle grid */}
        <div style={{ position: "fixed", inset: 0, backgroundImage: `radial-gradient(circle at 50% 0%, rgba(200,255,0,0.04) 0%, transparent 65%), linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`, backgroundSize: "100% 100%, 80px 80px, 80px 80px", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "28px 20px 60px" : "52px 40px 80px", position: "relative", zIndex: 1 }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 48 }}>
            <div>
              <button className="pill-btn" onClick={() => router.push("/")} style={{ marginBottom: 20 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 6 }}><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back
              </button>
              <h1 className="fade-up" style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "clamp(32px,6vw,52px)", fontWeight: 400, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
                Growth<br /><span style={{ color: LIME }}>Playbook</span>
              </h1>
              <p className="fade-up" style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 12, letterSpacing: "0.08em", animationDelay: "0.08s" }}>
                AI-POWERED STRATEGY · NOT FINANCIAL ADVICE
              </p>
            </div>

            {/* Tab switcher */}
            {(guide || roadmap) && (
              <div className="fade-up" style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 4, gap: 4, alignSelf: "flex-end", animationDelay: "0.12s" }}>
                {(["guide", "roadmap"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.2s", background: tab === t ? LIME : "transparent", color: tab === t ? "#060606" : "rgba(255,255,255,0.4)", fontWeight: tab === t ? 700 : 400 }}>
                    {t === "guide" ? "Guide" : "Roadmap"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Improvement Guide ── */}
          {tab === "guide" && guide?.sections?.map((section: any, i: number) => {
            const open = activeSection === i;
            return (
              <div key={i} className="fade-up section-card" data-open={open}
                style={{ marginBottom: 8, borderRadius: 14, border: `1px solid ${open ? "rgba(200,255,0,0.22)" : "rgba(255,255,255,0.07)"}`, background: open ? "rgba(200,255,0,0.03)" : "rgba(255,255,255,0.015)", transition: "border-color 0.25s, background 0.25s", animationDelay: `${i * 0.05}s`, overflow: "hidden" }}>

                {/* Section header */}
                <button onClick={() => setActiveSection(open ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: open ? LIME : "rgba(255,255,255,0.2)", flexShrink: 0, transition: "color 0.2s" }}>{SECTION_SYMBOLS[i % SECTION_SYMBOLS.length]}</span>
                  <span style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 18, color: open ? "white" : "rgba(255,255,255,0.75)", flex: 1, letterSpacing: "-0.01em", transition: "color 0.2s" }}>{section.title}</span>
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `1px solid ${open ? "rgba(200,255,0,0.3)" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", background: open ? LIME_DIM : "transparent" }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.25s" }}>
                      <path d="M2 1.5L5.5 4L2 6.5" stroke={open ? LIME : "rgba(255,255,255,0.3)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>

                {/* Section body */}
                {open && (
                  <div style={{ padding: "0 22px 22px" }}>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 18 }} />
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,0.55)", marginBottom: section.actions?.length ? 20 : 0 }}>
                      {section.explanation}
                    </p>
                    {section.actions?.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {section.actions.map((action: string, ai: number) => (
                          <div key={ai} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ width: 22, height: 22, minWidth: 22, borderRadius: 7, background: LIME_DIM, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", fontSize: 9, color: LIME, fontWeight: 700 }}>{String(ai + 1).padStart(2, "0")}</div>
                            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.6)" }}>{action}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Roadmap ── */}
          {tab === "roadmap" && roadmap?.roadmap?.length > 0 && (
            <div>
              {/* Summary row */}
              <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
                {[
                  { label: "Months planned", value: roadmap.roadmap.length },
                  { label: "Total tasks", value: roadmap.roadmap.reduce((s: number, m: any) => s + (m.tasks?.length || 0), 0) },
                  { label: "Avg tasks/mo", value: Math.round(roadmap.roadmap.reduce((s: number, m: any) => s + (m.tasks?.length || 0), 0) / roadmap.roadmap.length) },
                ].map((stat) => (
                  <div key={stat.label} style={{ flex: "1 1 120px", padding: "16px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 28, fontWeight: 400, color: "white" }}>{stat.value}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, letterSpacing: "0.06em" }}>{stat.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Month cards */}
              {roadmap.roadmap.map((m: any, i: number) => {
                const open = activeMonth === i;
                const color = MONTH_PALETTE[i % MONTH_PALETTE.length];
                return (
                  <div key={i} className="fade-up" onClick={() => setActiveMonth(open ? null : i)}
                    style={{ marginBottom: 8, borderRadius: 14, border: `1px solid ${open ? color + "30" : "rgba(255,255,255,0.06)"}`, background: open ? `${color}05` : "rgba(255,255,255,0.015)", cursor: "pointer", transition: "all 0.2s", animationDelay: `${i * 0.04}s`, overflow: "hidden" }}>

                    <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                      {/* Month number badge */}
                      <div style={{ width: 34, height: 34, minWidth: 34, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", fontSize: 11, color, fontWeight: 700 }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7, gap: 8 }}>
                          <h3 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 16, color: open ? color : "white", letterSpacing: "-0.01em", transition: "color 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.month}</h3>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{m.tasks?.length || 0} tasks</span>
                        </div>
                        <Bar pct={((i + 1) / roadmap.roadmap.length) * 100} color={color} />
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="7" height="7" viewBox="0 0 8 8" fill="none" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.25s" }}>
                          <path d="M2 1.5L5.5 4L2 6.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    {open && m.tasks?.length > 0 && (
                      <div style={{ padding: "0 20px 18px", paddingLeft: 70 }}>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 14 }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {m.tasks.map((t: string, ti: number) => (
                            <div key={ti} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <div style={{ width: 5, height: 5, minWidth: 5, borderRadius: "50%", background: color, opacity: 0.7, marginTop: 6 }} />
                              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{t}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Empty state ── */}
          {!guide && !roadmap && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22 }}>◎</div>
              <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 24, letterSpacing: "0.05em" }}>NO ANALYSIS DATA FOUND</p>
              <button className="pill-btn-primary" onClick={() => router.push("/")}>← Run an Analysis First</button>
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{ marginTop: 56, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>CORTIQ © 2025</span>
            <a href="#" style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em", textDecoration: "none" }}>PRIVACY · TERMS</a>
          </div>
        </div>
      </main>
    </>
  );
}

/* ─────────────────────────────────────────── CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #060606; overflow-x: hidden; }

  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  .fade-up { animation: fadeUp 0.45s ease both; }

  .orb-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 1.5px solid ${LIME};
    opacity: 0.4;
    animation: pulse 2.4s ease-in-out infinite;
  }

  .pill-btn {
    display: inline-flex; align-items: center;
    background: none;
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.45);
    border-radius: 999px;
    padding: 8px 16px;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.06em;
    transition: all 0.2s;
    min-height: 36px;
    -webkit-tap-highlight-color: transparent;
  }
  .pill-btn:hover { border-color: rgba(255,255,255,0.25); color: white; }

  .pill-btn-primary {
    display: inline-flex; align-items: center; justify-content: center;
    background: ${LIME};
    color: #060606;
    border: none;
    border-radius: 999px;
    padding: 12px 28px;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    transition: all 0.2s;
    min-height: 44px;
    -webkit-tap-highlight-color: transparent;
  }
  .pill-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
`;