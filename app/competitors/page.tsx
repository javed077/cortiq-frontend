"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

const ACCENT = "#C8FF00";
const RED    = "#FF4444";
const YELLOW = "#FFB800";
const CYAN   = "#00E5FF";
const PURPLE = "#A855F7";

const COMP_COLORS = [CYAN, YELLOW, PURPLE, "#FF6B6B", "#00E5A0"];

// ── helpers ───────────────────────────────────────────────────────────────────

function grade(score: number) {
  if (score >= 80) return { label: "Strong",   color: ACCENT  };
  if (score >= 60) return { label: "Moderate", color: YELLOW  };
  if (score >= 40) return { label: "Weak",     color: "#FF9900" };
  return               { label: "Poor",    color: RED     };
}

// ── radar tooltip ──────────────────────────────────────────────────────────────
const RadarTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0D0D0D", border: "1px solid rgba(200,255,0,0.2)", padding: "8px 12px", borderRadius: 8, fontFamily: "'Space Mono',monospace", fontSize: 11 }}>
      <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{payload[0]?.payload?.axis}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ── threat badge ──────────────────────────────────────────────────────────────
function ThreatBadge({ level }: { level: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    high:   { color: RED,    bg: "rgba(255,68,68,0.1)"   },
    medium: { color: YELLOW, bg: "rgba(255,184,0,0.1)"   },
    low:    { color: ACCENT, bg: "rgba(200,255,0,0.08)"  },
  };
  const s = map[level?.toLowerCase()] || map.medium;
  return (
    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", color: s.color, background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 4, padding: "2px 8px" }}>
      {level} threat
    </span>
  );
}

// ── score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ value, color, label }: { value: number; color: string; label: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW(value), 150); }, [value]);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{label}</span>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color }}>{value}</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 2, transition: "width 0.9s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

// ── competitor card ───────────────────────────────────────────────────────────
function CompCard({ comp, index, selected, onClick }: { comp: any; index: number; selected: boolean; onClick: () => void }) {
  const color  = COMP_COLORS[index % COMP_COLORS.length];
  const threat = grade(comp.threat_score || 50);

  return (
    <div onClick={onClick} style={{
      background: selected ? `${color}08` : "rgba(255,255,255,0.02)",
      border: `1px solid ${selected ? color + "40" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 14, padding: "18px 20px", cursor: "pointer",
      transition: "all 0.2s", position: "relative", overflow: "hidden",
    }}>
      {/* left accent */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: selected ? color : "transparent", transition: "background 0.2s" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "white", marginBottom: 4 }}>{comp.name}</h3>
          <ThreatBadge level={comp.threat_level || "medium"} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color, lineHeight: 1 }}>
            {comp.threat_score || "—"}
          </div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>threat score</div>
        </div>
      </div>

      {comp.description && (
        <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 12 }}>
          {comp.description}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {comp.funding && (
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "2px 8px" }}>
            💰 {comp.funding}
          </span>
        )}
        {comp.founded && (
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "2px 8px" }}>
            📅 {comp.founded}
          </span>
        )}
        {comp.pricing_model && (
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "2px 8px" }}>
            🏷 {comp.pricing_model}
          </span>
        )}
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function CompetitorPage() {
  const router = useRouter();
  const API    = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const [competitors, setCompetitors] = useState<any[]>([]);
  const [summary,     setSummary]     = useState<any>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [selected,    setSelected]    = useState(0);
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    const f = localStorage.getItem("cortiq_form");
    const r = localStorage.getItem("cortiq_result");
    if (f && r) autoLoad(JSON.parse(f), JSON.parse(r));
  }, []);

  async function autoLoad(form: any, result: any) {
    if (!form.idea) return;
    await fetchDeepDive(form.idea, form.competitors || "", result.result || result);
  }

  async function fetchDeepDive(idea: string, comps: string, metrics: any) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/competitor-deep-dive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, competitors: comps, metrics }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setCompetitors(data.competitors || []);
      setSummary(data.summary || null);
      setSelected(0);
    } catch {
      setError("Analysis failed — check backend connection.");
    }
    setLoading(false);
  }

  function handleAddCustom() {
    if (!customInput.trim()) return;
    const f = JSON.parse(localStorage.getItem("cortiq_form") || "{}");
    const r = JSON.parse(localStorage.getItem("cortiq_result") || "{}");
    fetchDeepDive(f.idea || "", customInput, r.result || r);
    setCustomInput("");
  }

  const activeComp = competitors[selected];
  const activeColor = COMP_COLORS[selected % COMP_COLORS.length];

  // build radar data from active competitor
  const radarData = activeComp ? [
    { axis: "Product",     You: 70, [activeComp.name]: activeComp.scores?.product     || 50 },
    { axis: "Pricing",     You: 65, [activeComp.name]: activeComp.scores?.pricing     || 50 },
    { axis: "Marketing",   You: 60, [activeComp.name]: activeComp.scores?.marketing   || 50 },
    { axis: "Tech",        You: 75, [activeComp.name]: activeComp.scores?.technology  || 50 },
    { axis: "Support",     You: 70, [activeComp.name]: activeComp.scores?.support     || 50 },
    { axis: "Brand",       You: 55, [activeComp.name]: activeComp.scores?.brand       || 50 },
  ] : [];

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
        @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .tag { display:inline-block; padding:3px 10px; background:rgba(200,255,0,0.10); border:1px solid rgba(200,255,0,0.25); border-radius:4px; font-family:'Space Mono',monospace; font-size:9px; color:${ACCENT}; letter-spacing:0.15em; text-transform:uppercase; }
        .panel { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:24px; }
        .panel:hover { border-color:rgba(255,255,255,0.11); transition:border-color 0.25s; }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: "40px 24px", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* header */}
          <div className="fade-up" style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: CYAN, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>⊕</span>
              </div>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>CORTIQ · COMPETITOR INTELLIGENCE</span>
              {loading && <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: CYAN, borderRadius: "50%", animation: "spin 0.8s linear infinite", marginLeft: 8 }} />}
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              Competitor<br /><span style={{ color: CYAN }}>Deep-Dive</span>
            </h1>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
              AI-powered intelligence on every competitor — funding, pricing, weaknesses, and your edge
            </p>
          </div>

          {/* custom competitor input */}
          <div className="panel fade-up" style={{ marginBottom: 20, animationDelay: "0.05s" }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12 }}>Analyze Additional Competitors</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddCustom()}
                placeholder="e.g. Notion, Linear, Figma — comma separated"
                style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "white", fontFamily: "'Space Mono',monospace", fontSize: 12, outline: "none" }}
                onFocus={e => e.target.style.borderColor = CYAN + "60"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <button onClick={handleAddCustom} disabled={loading} style={{ padding: "10px 20px", background: CYAN, color: "#050505", fontFamily: "'Space Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", border: "none", borderRadius: 8, cursor: "pointer", transition: "all 0.2s", opacity: loading ? 0.5 : 1 }}>
                Analyze →
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 10, fontFamily: "'Space Mono',monospace", fontSize: 11, color: RED, marginBottom: 16 }}>
              ⚠ {error}
            </div>
          )}

          {/* loading skeleton */}
          {loading && !competitors.length && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 20px", height: 140, animation: "pulse 1.5s ease infinite", animationDelay: `${i*0.2}s` }} />
              ))}
            </div>
          )}

          {competitors.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>

              {/* left: competitor list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span className="tag" style={{ background: "rgba(0,229,255,0.08)", borderColor: "rgba(0,229,255,0.25)", color: CYAN }}>
                    {competitors.length} Competitors
                  </span>
                </div>
                {competitors.map((comp, i) => (
                  <div key={i} className="fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                    <CompCard comp={comp} index={i} selected={selected === i} onClick={() => setSelected(i)} />
                  </div>
                ))}
              </div>

              {/* right: detail panel */}
              {activeComp && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* header */}
                  <div className="panel" style={{ borderColor: activeColor + "25" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "white", marginBottom: 6 }}>{activeComp.name}</h2>
                        <ThreatBadge level={activeComp.threat_level || "medium"} />
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 48, color: activeColor, lineHeight: 1 }}>{activeComp.threat_score}</div>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.3)" }}>/ 100 threat</div>
                      </div>
                    </div>
                    {activeComp.description && (
                      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{activeComp.description}</p>
                    )}
                  </div>

                  {/* scores + radar */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

                    {/* score bars */}
                    <div className="panel">
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>Capability Scores</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {[
                          { key: "product",    label: "Product"    },
                          { key: "pricing",    label: "Pricing"    },
                          { key: "marketing",  label: "Marketing"  },
                          { key: "technology", label: "Technology" },
                          { key: "support",    label: "Support"    },
                          { key: "brand",      label: "Brand"      },
                        ].map(({ key, label }) => (
                          <ScoreBar key={key} label={label} value={activeComp.scores?.[key] || 50} color={activeColor} />
                        ))}
                      </div>
                    </div>

                    {/* radar */}
                    <div className="panel">
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>You vs {activeComp.name}</div>
                      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                        {[["You", ACCENT], [activeComp.name, activeColor]].map(([lbl, c]: any) => (
                          <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.4)" }}>{lbl}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ height: 200 }}>
                        <ResponsiveContainer>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.06)" />
                            <PolarAngleAxis dataKey="axis" tick={{ fontFamily: "'Space Mono',monospace", fontSize: 8, fill: "rgba(255,255,255,0.35)" }} />
                            <Tooltip content={<RadarTip />} />
                            <Radar name="You" dataKey="You" stroke={ACCENT} fill={ACCENT} fillOpacity={0.1} strokeWidth={1.5} />
                            <Radar name={activeComp.name} dataKey={activeComp.name} stroke={activeColor} fill={activeColor} fillOpacity={0.1} strokeWidth={1.5} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* strengths + weaknesses + your edge */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    {[
                      { title: "Strengths",    items: activeComp.strengths  || [], color: YELLOW,     icon: "↑" },
                      { title: "Weaknesses",   items: activeComp.weaknesses || [], color: RED,        icon: "↓" },
                      { title: "Your Edge",    items: activeComp.your_edge  || [], color: ACCENT,     icon: "⬡" },
                    ].map(({ title, items, color, icon }) => (
                      <div key={title} className="panel" style={{ borderColor: color + "18" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                          <span style={{ color, fontSize: 12 }}>{icon}</span>
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{title}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {items.map((item: string, i: number) => (
                            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <div style={{ width: 4, height: 4, borderRadius: "50%", background: color, marginTop: 5, flexShrink: 0 }} />
                              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{item}</span>
                            </div>
                          ))}
                          {items.length === 0 && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Analyzing…</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* positioning strategy */}
                  {activeComp.positioning_strategy && (
                    <div className="panel" style={{ borderColor: `${activeColor}25`, background: `${activeColor}04` }}>
                      <div style={{ display: "flex", gap: 14 }}>
                        <span style={{ fontSize: 20, color: activeColor }}>◎</span>
                        <div>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: activeColor, textTransform: "uppercase", marginBottom: 8 }}>
                            Positioning Strategy vs {activeComp.name}
                          </div>
                          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
                            {activeComp.positioning_strategy}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* overall summary */}
          {summary && (
            <div className="panel fade-up" style={{ marginTop: 20, borderColor: "rgba(200,255,0,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span className="tag">Competitive Summary</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>Market Position</div>
                  <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.75, color: "rgba(255,255,255,0.6)" }}>{summary.market_position}</p>
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>Recommended Moat</div>
                  <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.75, color: "rgba(255,255,255,0.6)" }}>{summary.recommended_moat}</p>
                </div>
              </div>
            </div>
          )}

          {/* empty state */}
          {!competitors.length && !loading && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 40, color: "rgba(0,229,255,0.1)", marginBottom: 16 }}>⊕</div>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 20 }}>
                Add competitors above or run a full analysis from the dashboard
              </p>
              <button onClick={() => router.push("/")} style={{ padding: "10px 20px", background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", color: CYAN, fontFamily: "'Space Mono',monospace", fontSize: 11, borderRadius: 8, cursor: "pointer" }}>
                ← Back to Dashboard
              </button>
            </div>
          )}

          <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em" }}>CORTIQ © 2025</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>AI-POWERED · NOT FINANCIAL ADVICE</span>
          </div>
        </div>
      </main>
    </>
  );
}