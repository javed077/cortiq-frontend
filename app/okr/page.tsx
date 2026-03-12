"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#C8FF00"; const CYAN = "#00E5FF"; const YELLOW = "#FFB800"; const PURPLE = "#A855F7"; const RED = "#FF4444";
const Q_COLORS = [ACCENT, CYAN, YELLOW, PURPLE]; const Q_LABELS = ["Q1", "Q2", "Q3", "Q4"];

function Ring({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r = size * 0.38, cx = size / 2, cy = size / 2, c = 2 * Math.PI * r;
  const [fill, setFill] = useState(0);
  useEffect(() => { setTimeout(() => setFill(pct), 200); }, [pct]);
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.08} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.08}
        strokeDasharray={`${c * fill / 100} ${c}`} strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 4px ${color}80)` }} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={size * 0.22} fontFamily="'Space Mono',monospace" fontWeight="700">{pct}%</text>
    </svg>
  );
}

function KRRow({ kr, index, color, qIdx }: { kr: any; index: number; color: string; qIdx: number }) {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: checked ? 0.45 : 1, transition: "opacity 0.3s" }}>
      <div onClick={() => setChecked(!checked)} style={{ width: 22, height: 22, minWidth: 22, borderRadius: 4, flexShrink: 0, marginTop: 1, background: checked ? color : "transparent", border: `1.5px solid ${checked ? color : "rgba(255,255,255,0.15)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", boxShadow: checked ? `0 0 8px ${color}60` : "none" }}>
        {checked && <span style={{ color: "#050505", fontSize: 11, fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color, letterSpacing: "0.1em" }}>KR{qIdx + 1}.{index + 1}</span>
          {kr.metric && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, padding: "1px 6px" }}>{kr.metric}</span>}
        </div>
        <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: checked ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)", lineHeight: 1.55, textDecoration: checked ? "line-through" : "none", wordBreak: "break-word" }}>{kr.description || kr}</p>
        {kr.target && <div style={{ marginTop: 4, fontFamily: "'Space Mono',monospace", fontSize: 9, color }}>Target: {kr.target}</div>}
      </div>
    </div>
  );
}

function ObjectiveCard({ obj, objIdx, qIdx, color }: { obj: any; objIdx: number; qIdx: number; color: string }) {
  const [open, setOpen] = useState(objIdx === 0);
  const krs = obj.key_results || [];
  return (
    <div style={{ background: open ? `${color}05` : "rgba(255,255,255,0.02)", border: `1px solid ${open ? color + "30" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, overflow: "hidden", transition: "all 0.2s" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, textAlign: "left", minHeight: 56, WebkitTapHighlightColor: "transparent" }}>
        <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: 8, background: open ? color + "20" : "rgba(255,255,255,0.04)", border: `1px solid ${open ? color + "40" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 9, color: open ? color : "rgba(255,255,255,0.3)", fontWeight: 700 }}>O{objIdx + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: open ? "white" : "rgba(255,255,255,0.75)", lineHeight: 1.3, wordBreak: "break-word" }}>{obj.objective}</p>
          {!open && <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>{krs.length} key results</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Ring pct={obj.completion || 0} color={color} size={36} />
          <span style={{ color: open ? color : "rgba(255,255,255,0.2)", fontFamily: "'Space Mono',monospace", fontSize: 10, display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.25s" }}>▶</span>
        </div>
      </button>
      {open && krs.length > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
            {krs.map((kr: any, i: number) => <KRRow key={i} kr={kr} index={i} color={color} qIdx={qIdx} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function QuarterTab({ quarter, qIdx, active, onClick, isMobile }: any) {
  const color = Q_COLORS[qIdx];
  const objs = quarter.objectives || [];
  const totalKRs = objs.reduce((acc: number, o: any) => acc + (o.key_results?.length || 0), 0);
  return (
    <div onClick={onClick} style={{ background: active ? `${color}06` : "rgba(255,255,255,0.02)", border: `1px solid ${active ? color + "35" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: isMobile ? "12px 14px" : "16px 18px", cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden", WebkitTapHighlightColor: "transparent" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: active ? color : "transparent", transition: "background 0.2s" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: isMobile ? 16 : 20, color: active ? color : "rgba(255,255,255,0.6)" }}>{Q_LABELS[qIdx]}</div>
        <Ring pct={quarter.completion || 0} color={color} size={isMobile ? 32 : 40} />
      </div>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.25)" }}>{objs.length} obj · {totalKRs} KRs</div>
      {quarter.theme && !isMobile && <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: active ? color : "rgba(255,255,255,0.35)", marginTop: 4, lineHeight: 1.4 }}>{quarter.theme}</div>}
    </div>
  );
}

export default function OKRPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
  const [okrs, setOkrs] = useState<any>(null); const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); const [activeQ, setActiveQ] = useState(0);
  const [horizon, setHorizon] = useState<"quarterly" | "annual">("quarterly");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const r = localStorage.getItem("cortiq_result"); const f = localStorage.getItem("cortiq_form");
    if (r && f) fetchOKRs(JSON.parse(r), JSON.parse(f));
  }, []);

  async function fetchOKRs(cortiqResult: any, form: any) {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/okr-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ result: cortiqResult.result || cortiqResult, form, strategy: cortiqResult.strategy || [], roadmap: cortiqResult.roadmap || [], horizon }) });
      if (!res.ok) throw new Error("Failed");
      setOkrs(await res.json());
    } catch { setError("OKR generation failed — check backend."); }
    setLoading(false);
  }

  function regenerate() {
    const r = localStorage.getItem("cortiq_result"); const f = localStorage.getItem("cortiq_form");
    if (r && f) fetchOKRs(JSON.parse(r), JSON.parse(f));
  }

  const quarters = okrs?.quarters || [];
  const activeQuarter = quarters[activeQ];
  const totalObjectives = quarters.reduce((acc: number, q: any) => acc + (q.objectives?.length || 0), 0);
  const totalKRs = quarters.reduce((acc: number, q: any) => acc + (q.objectives || []).reduce((a: number, o: any) => a + (o.key_results?.length || 0), 0), 0);

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
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .tag { display:inline-block; padding:3px 10px; background:rgba(200,255,0,0.10); border:1px solid rgba(200,255,0,0.25); border-radius:4px; font-family:'Space Mono',monospace; font-size:9px; color:${ACCENT}; letter-spacing:0.15em; text-transform:uppercase; }
        .panel { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:24px; }
        .action-btn { padding:12px 18px; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.1em; border-radius:10px; cursor:pointer; transition:all 0.2s; min-height:48px; -webkit-tap-highlight-color:transparent; }
        @media (max-width:768px) { .panel { padding: 16px; } }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: isMobile ? "20px 16px" : "40px 24px", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="fade-up" style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: PURPLE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 16, color: "white" }}>◈</span></div>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>CORTIQ · OKR ENGINE</span>
              {loading && <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: PURPLE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,5vw,46px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              OKR<br /><span style={{ color: PURPLE }}>Generator</span>
            </h1>
          </div>

          <div className="panel fade-up" style={{ marginBottom: 16, animationDelay: "0.05s" }}>
            <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 16, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
              <div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>Horizon</div>
                <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden" }}>
                  {(["quarterly", "annual"] as const).map(h => (
                    <button key={h} onClick={() => setHorizon(h)} style={{ padding: "10px 18px", background: horizon === h ? PURPLE : "transparent", color: horizon === h ? "white" : "rgba(255,255,255,0.35)", fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: "0.1em", border: "none", cursor: "pointer", transition: "all 0.2s", fontWeight: horizon === h ? 700 : 400, minHeight: 44, WebkitTapHighlightColor: "transparent" }}>
                      {h.charAt(0).toUpperCase() + h.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {okrs && (
                <div style={{ display: "flex", gap: isMobile ? 16 : 20, alignItems: "center", flexWrap: "wrap" }}>
                  {[{ label: "Quarters", value: quarters.length }, { label: "Objectives", value: totalObjectives }, { label: "Key Results", value: totalKRs }].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: isMobile ? 18 : 22, color: PURPLE }}>{s.value}</div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.25)" }}>{s.label}</div>
                    </div>
                  ))}
                  <button className="action-btn" onClick={regenerate} disabled={loading} style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: PURPLE }}>↻ Regenerate</button>
                </div>
              )}

              {!okrs && !loading && (
                <button className="action-btn" onClick={regenerate} style={{ background: PURPLE, color: "white", border: "none", fontWeight: 700, width: isMobile ? "100%" : "auto" }}>◈ Generate OKRs</button>
              )}
            </div>
          </div>

          {error && <div style={{ padding: "12px 16px", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 10, fontFamily: "'Space Mono',monospace", fontSize: 11, color: RED, marginBottom: 16 }}>⚠ {error}</div>}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ height: 72, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, animation: "pulse 1.5s ease infinite", animationDelay: `${i * 0.2}s` }} />)}
            </div>
          )}

          {quarters.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10 }}>
                {quarters.map((q: any, i: number) => (
                  <div key={i} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                    <QuarterTab quarter={q} qIdx={i} active={activeQ === i} onClick={() => setActiveQ(i)} isMobile={isMobile} />
                  </div>
                ))}
              </div>

              {activeQuarter && (
                <div className="fade-up" style={{ animationDelay: "0.1s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: Q_COLORS[activeQ] }}>{Q_LABELS[activeQ]}</span>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{activeQuarter.period}</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)", minWidth: 20 }} />
                    <span className="tag" style={{ background: `${Q_COLORS[activeQ]}12`, borderColor: `${Q_COLORS[activeQ]}30`, color: Q_COLORS[activeQ] }}>{(activeQuarter.objectives || []).length} objectives</span>
                  </div>
                  {activeQuarter.theme && (
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14, padding: "10px 14px", background: `${Q_COLORS[activeQ]}08`, border: `1px solid ${Q_COLORS[activeQ]}20`, borderRadius: 8 }}>◎ {activeQuarter.theme}</div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(activeQuarter.objectives || []).map((obj: any, i: number) => <ObjectiveCard key={i} obj={obj} objIdx={i} qIdx={activeQ} color={Q_COLORS[activeQ]} />)}
                  </div>
                </div>
              )}

              {okrs?.annual_goal && (
                <div className="panel fade-up" style={{ borderColor: "rgba(200,255,0,0.12)", background: "rgba(200,255,0,0.02)" }}>
                  <div style={{ display: "flex", gap: 14 }}>
                    <span style={{ fontSize: 20, color: ACCENT, flexShrink: 0 }}>⬡</span>
                    <div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", marginBottom: 8 }}>Annual North Star</div>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "white", lineHeight: 1.4 }}>{okrs.annual_goal}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!okrs && !loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 40, color: "rgba(168,85,247,0.12)", marginBottom: 16 }}>◈</div>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 20 }}>OKRs will be generated from your roadmap and strategy data</p>
              <button className="action-btn" onClick={() => router.push("/")} style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: PURPLE }}>← Run an Analysis First</button>
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