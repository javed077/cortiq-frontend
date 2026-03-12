"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#C8FF00";

function Bar({ pct, color = ACCENT }: { pct: number; color?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const id = setTimeout(() => setW(pct), 120); return () => clearTimeout(id); }, [pct]);
  return (
    <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 2, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

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
    <main style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, border: "2px solid rgba(255,255,255,0.06)", borderTopColor: ACCENT, borderRadius: "50%", margin: "0 auto 28px", animation: "spin 0.9s linear infinite" }} />
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(20px,5vw,28px)", fontWeight: 800, color: "white" }}>Generating Strategy{".".repeat(dots)}</h1>
        <div style={{ marginTop: 24 }}>
          {steps.map((s, i) => <div key={i} style={{ opacity: i <= step ? 1 : 0.3, marginBottom: 6, fontFamily: "'Space Mono',monospace", fontSize: 11, color: i === step ? ACCENT : "rgba(255,255,255,0.5)" }}>{s}</div>)}
        </div>
      </div>
    </main>
  );
}

export default function ImprovePage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "";
  const [guide, setGuide] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<number | null>(0);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("cortiq_result");
    if (!stored) { setLoading(false); return; }
    const data = JSON.parse(stored);
    Promise.all([fetchGuide(data), fetchRoadmap(data)]).finally(() => setLoading(false));
  }, []);

  async function fetchGuide(data: any) {
    try { const res = await fetch(`${API}/improvement-guide`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); setGuide(await res.json()); } catch {}
  }
  async function fetchRoadmap(data: any) {
    try { const res = await fetch(`${API}/startup-roadmap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); setRoadmap(await res.json()); } catch {}
  }

  if (loading) return <LoadingScreen />;

  const sectionIcons = ["◎", "⬡", "△", "◇", "○", "□"];
  const monthColors = [ACCENT, "#00E5FF", "#FF6B6B", "#FFB800", ACCENT, "#00E5FF", "#FF6B6B", "#FFB800", ACCENT, "#00E5FF", "#FF6B6B", "#FFB800"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #050505; overflow-x: hidden; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .back-btn { display:inline-flex; align-items:center; gap:8px; background:none; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); border-radius:10px; padding:12px 16px; cursor:pointer; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.15em; transition:all 0.2s; min-height:48px; -webkit-tap-highlight-color:transparent; }
        .back-btn:hover { border-color:rgba(255,255,255,0.25); color:white; }
        .section-btn { width:100%; padding:18px 20px; text-align:left; background:none; border:none; color:white; cursor:pointer; font-family:'Space Mono',monospace; font-size:12px; letter-spacing:0.05em; line-height:1.5; min-height:56px; -webkit-tap-highlight-color:transparent; }
        .month-card { border-radius:12px; padding:18px; margin-bottom:10px; cursor:pointer; -webkit-tap-highlight-color:transparent; transition:all 0.2s; }
        .goto-btn { padding:14px 24px; font-family:'Space Mono',monospace; font-size:11px; font-weight:700; border-radius:10px; border:none; cursor:pointer; min-height:52px; -webkit-tap-highlight-color:transparent; transition:all 0.2s; }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: isMobile ? "20px 16px" : "40px 24px", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <button className="back-btn" onClick={() => router.push("/")} style={{ marginBottom: 24 }}>← Back</button>

          <h1 className="fade-up" style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,6vw,44px)", fontWeight: 800, marginBottom: 24, letterSpacing: "-0.02em" }}>
            Growth <span style={{ color: ACCENT }}>Playbook</span>
          </h1>

          {guide?.sections?.map((section: any, i: number) => {
            const open = activeSection === i;
            return (
              <div key={i} className="fade-up" style={{ border: `1px solid ${open ? ACCENT + "30" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, marginBottom: 10, background: open ? "rgba(200,255,0,0.03)" : "rgba(255,255,255,0.01)", transition: "all 0.2s", animationDelay: `${i * 0.04}s` }}>
                <button className="section-btn" onClick={() => setActiveSection(open ? null : i)}>
                  <span style={{ color: open ? ACCENT : "rgba(255,255,255,0.5)", marginRight: 10 }}>{sectionIcons[i % sectionIcons.length]}</span>
                  <span style={{ color: open ? "white" : "rgba(255,255,255,0.8)" }}>{section.title}</span>
                  <span style={{ float: "right", color: "rgba(255,255,255,0.3)", display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>
                </button>
                {open && (
                  <div style={{ padding: "0 20px 20px" }}>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.8, color: "rgba(255,255,255,0.65)" }}>{section.explanation}</p>
                      {section.actions?.length > 0 && (
                        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                          {section.actions.map((action: string, ai: number) => (
                            <div key={ai} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: 6, background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 8, color: ACCENT }}>{ai + 1}</div>
                              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.6, color: "rgba(255,255,255,0.6)" }}>{action}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {roadmap?.roadmap?.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>12-Month Roadmap</div>
              {roadmap.roadmap.map((m: any, i: number) => {
                const open = activeMonth === i;
                const color = monthColors[i % monthColors.length];
                return (
                  <div key={i} className="month-card" style={{ border: `1px solid ${open ? color + "40" : color + "18"}`, background: open ? `${color}06` : "rgba(255,255,255,0.02)" }}
                    onClick={() => setActiveMonth(open ? null : i)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: open ? color : "white" }}>{m.month}</h3>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color }}>{m.tasks?.length || 0} tasks</span>
                    </div>
                    <Bar pct={((i + 1) / roadmap.roadmap.length) * 100} color={color} />
                    {open && m.tasks?.map((t: string, ti: number) => (
                      <div key={ti} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: ti === 0 ? 14 : 8 }}>
                        <div style={{ width: 4, height: 4, minWidth: 4, borderRadius: "50%", background: color, marginTop: 5 }} />
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {!guide && !roadmap && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>No analysis data found.</p>
              <button className="goto-btn" onClick={() => router.push("/")} style={{ background: ACCENT, color: "#050505" }}>← Run an Analysis First</button>
            </div>
          )}

          <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>CORTIQ © 2025</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>AI-POWERED · NOT FINANCIAL ADVICE</span>
          </div>
        </div>
      </main>
    </>
  );
}