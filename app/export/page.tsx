"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#C8FF00";

function fmt(n: number | string) {
  const v = Number(n);
  if (isNaN(v)) return String(n);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color, width: 28, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function ExportPage() {
  const router   = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [result,         setResult]         = useState<any>(null);
  const [form,           setForm]           = useState<any>(null);
  const [strategy,       setStrategy]       = useState<string[]>([]);
  const [marketResearch, setMarketResearch] = useState<any>(null);
  const [investorScore,  setInvestorScore]  = useState<any>(null);
  const [generating,     setGenerating]     = useState(false);
  const [sent,           setSent]           = useState(false);
  const [isMobile,       setIsMobile]       = useState(false);   // ← ADDED

  useEffect(() => {
    const r = localStorage.getItem("cortiq_result");
    const f = localStorage.getItem("cortiq_form");
    if (r) {
      const parsed = JSON.parse(r);
      setResult(parsed.result);
      setStrategy(parsed.strategy || []);
      setMarketResearch(parsed.marketResearch);
      setInvestorScore(parsed.investorScore);
    }
    if (f) setForm(JSON.parse(f));

    // ── MOBILE DETECTION ──────────────────────────────────────
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
    // ──────────────────────────────────────────────────────────
  }, []);

  const handlePrint = () => {
    setGenerating(true);
    setTimeout(() => { window.print(); setGenerating(false); }, 300);
  };

  const handleServerPDF = async () => {
    setGenerating(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
      const res = await fetch(`${API}/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, form, strategy, marketResearch, investorScore }),
      });
      if (!res.ok) throw new Error("Server PDF failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `cortiq-analysis-${Date.now()}.pdf`; a.click();
      URL.revokeObjectURL(url);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch { window.print(); }
    setGenerating(false);
  };

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  if (!result) {
    return (
      <main style={{ minHeight: "100vh", background: "#050505", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>No analysis data found.</p>
          <button onClick={() => router.push("/")} style={{ padding: "14px 24px", background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.3)", color: ACCENT, borderRadius: 10, cursor: "pointer", fontSize: 12, letterSpacing: "0.12em", minHeight: 48 }}>
            ← Run an Analysis First
          </button>
        </div>
      </main>
    );
  }

  const healthItems = [
    { label: "Market",      value: result.market_health,      color: "#00E5FF" },
    { label: "Execution",   value: result.execution_health,   color: ACCENT },
    { label: "Finance",     value: result.finance_health,     color: "#FFB800" },
    { label: "Growth",      value: result.growth_health,      color: "#A855F7" },
    { label: "Competition", value: result.competition_health, color: "#FF6B6B" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #050505; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scanline { 0% { transform:translateY(-100%); } 100% { transform:translateY(100vh); } }
        .fade-up { animation: fadeUp 0.4s ease both; }

        .back-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: none; border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5); border-radius: 10px;
          padding: 12px 16px; cursor: pointer;
          font-family: 'Space Mono',monospace; font-size: 10px;
          letter-spacing: 0.15em; transition: all 0.2s;
          min-height: 48px; -webkit-tap-highlight-color: transparent;
        }
        .back-btn:hover { border-color: rgba(255,255,255,0.25); color: white; }

        .export-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'Space Mono',monospace; font-size: 11px;
          letter-spacing: 0.1em; font-weight: 700;
          border-radius: 10px; cursor: pointer;
          transition: all 0.2s; border: none;
          min-height: 48px; -webkit-tap-highlight-color: transparent;
        }

        .nav-btn {
          padding: 14px 24px; font-family: 'Space Mono',monospace;
          font-size: 11px; letter-spacing: 0.1em;
          border-radius: 10px; cursor: pointer;
          min-height: 52px; -webkit-tap-highlight-color: transparent;
          transition: all 0.2s;
        }

        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .report-page { background: white !important; color: #111 !important; padding: 0 !important; box-shadow: none !important; }
          .report-page * { color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .toolbar { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .toolbar-btns { display: flex; flex-direction: column; gap: 8px; }
          .report-cover { flex-direction: column !important; gap: 16px !important; }
          .report-cover-score { text-align: left !important; }
          .metrics-grid { grid-template-columns: 1fr 1fr !important; }
          .insight-grid { grid-template-columns: 1fr !important; }
          .market-grid  { grid-template-columns: 1fr !important; }
          .bottom-nav   { flex-direction: column !important; }
          .report-inner { padding: 20px 16px !important; }
          .report-header { padding: 24px 16px 20px !important; }
        }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: isMobile ? "20px 16px" : "40px 24px", position: "relative" }}>
        <div className="no-print" style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: 860, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* toolbar */}
          <div className="no-print fade-up toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, gap: 12 }}>
            <button className="back-btn" onClick={() => router.push("/")}>← Dashboard</button>
            <div className="toolbar-btns" style={{ display: "flex", gap: 10 }}>
              <button className="export-btn" onClick={handlePrint} disabled={generating}
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)", padding: isMobile ? "12px 16px" : "12px 24px", width: isMobile ? "100%" : "auto" }}>
                🖨 {isMobile ? "Print" : "Print / Save PDF"}
              </button>
              <button className="export-btn" onClick={handleServerPDF} disabled={generating}
                style={{ background: sent ? "#1a3300" : ACCENT, color: sent ? ACCENT : "#050505", border: `1px solid ${sent ? ACCENT : "transparent"}`, padding: isMobile ? "12px 16px" : "12px 24px", width: isMobile ? "100%" : "auto" }}>
                {generating ? "Generating..." : sent ? "✓ Downloaded!" : "⬇ Download PDF"}
              </button>
            </div>
          </div>

          {/* REPORT */}
          <div ref={printRef} className="report-page" style={{ background: "#0A0A0A", borderRadius: isMobile ? 14 : 20, overflow: "hidden" }}>

            {/* cover */}
            <div className="report-header" style={{ background: "linear-gradient(135deg,#0D1A00 0%,#0A0A0A 60%)", borderBottom: "1px solid rgba(200,255,0,0.15)", padding: isMobile ? "24px 20px" : "40px 48px 36px" }}>
              <div className="report-cover" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>⬡</div>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.3em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>CORTIQ · STARTUP INTELLIGENCE</span>
                  </div>
                  <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 22 : 32, fontWeight: 800, color: "white", lineHeight: 1.15, marginBottom: 8, wordBreak: "break-word" }}>
                    {form?.idea?.slice(0, 40) || "Startup"}<br />
                    <span style={{ color: ACCENT }}>Analysis Report</span>
                  </h1>
                  <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 8, lineHeight: 1.6 }}>
                    {form?.customer && `Target: ${form.customer}`}{form?.geography && ` · ${form.geography}`}<br />Generated {today}
                  </p>
                </div>
                <div className="report-cover-score" style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Health Score</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 48 : 64, fontWeight: 800, color: ACCENT, lineHeight: 1, textShadow: `0 0 40px ${ACCENT}60` }}>{result.health_score}</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>/100</div>
                </div>
              </div>
            </div>

            <div className="report-inner" style={{ padding: isMobile ? "20px 16px" : "36px 48px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* key metrics */}
              <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10 }}>
                {[
                  { label: "Success Prob.", value: `${Math.round(result.market_health*0.30+result.execution_health*0.25+result.finance_health*0.20+result.growth_health*0.15+result.competition_health*0.10)}%`, color: ACCENT },
                  { label: "Runway",        value: `${result.runway_months}mo`, color: result.runway_months > 18 ? ACCENT : result.runway_months > 9 ? "#FFB800" : "#FF4444" },
                  { label: "Risk Index",    value: `${result.risk_score}`,       color: result.risk_score > 60 ? "#FF4444" : "#FFB800" },
                  { label: "Investor",      value: investorScore ? `${investorScore.investor_score}` : "—", color: "#00E5FF" },
                ].map(m => (
                  <div key={m.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: isMobile ? "12px" : "14px 16px" }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 20 : 24, fontWeight: 800, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* health breakdown */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: isMobile ? "16px" : "20px 24px" }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 14 }}>Health Breakdown</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {healthItems.map(h => (
                    <div key={h.label} style={{ display: "grid", gridTemplateColumns: isMobile ? "80px 1fr" : "100px 1fr", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{h.label}</span>
                      <ScoreBar value={h.value} color={h.color} />
                    </div>
                  ))}
                </div>
              </div>

              {/* insight + risk */}
              <div className="insight-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.15)", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", marginBottom: 10 }}>Key Insight</div>
                  <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>{result.insight}</p>
                </div>
                <div style={{ background: "rgba(255,68,68,0.04)", border: "1px solid rgba(255,68,68,0.15)", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.2em", color: "#FF6B6B", textTransform: "uppercase", marginBottom: 10 }}>Critical Risk</div>
                  <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>{result.biggest_problem}</p>
                </div>
              </div>

              {/* improvements */}
              {result.improvements?.length > 0 && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: isMobile ? "16px" : "20px 24px" }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 14 }}>Recommended Improvements</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {result.improvements.map((imp: string, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 22, height: 22, minWidth: 22, borderRadius: 6, background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 8, color: ACCENT }}>{i+1}</div>
                        <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.65, color: "rgba(255,255,255,0.65)" }}>{imp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* market research */}
              {marketResearch && (
                <div className="market-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: 12 }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: isMobile ? "16px" : "20px 24px" }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 14 }}>Market Data</div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>MARKET SIZE</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: ACCENT }}>{marketResearch.market_size}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>GROWTH RATE</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: "white" }}>{marketResearch.growth_rate}</div>
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: isMobile ? "16px" : "20px 24px" }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 14 }}>Strategic Recommendations</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(strategy || []).map((s: string, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 4, height: 4, minWidth: 4, borderRadius: "50%", background: ACCENT, marginTop: 5, flexShrink: 0 }} />
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, lineHeight: 1.6, color: "rgba(255,255,255,0.6)" }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* investor verdict */}
              {investorScore && (
                <div style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.15)", borderRadius: 12, padding: isMobile ? "16px" : "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(0,229,255,0.7)", textTransform: "uppercase", marginBottom: 6 }}>Investor Readiness</div>
                    <p style={{ fontFamily: "'Space Mono',monospace", fontSize: isMobile ? 10 : 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{investorScore.verdict}</p>
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 36 : 48, fontWeight: 800, color: "#00E5FF", flexShrink: 0 }}>{investorScore.investor_score}</div>
                </div>
              )}

              {/* report footer */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 6 }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em" }}>CORTIQ · STARTUP INTELLIGENCE</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.2)" }}>NOT FINANCIAL ADVICE · {today}</span>
              </div>

            </div>
          </div>

          {/* bottom nav */}
          <div className="no-print bottom-nav" style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28, flexDirection: isMobile ? "column" : "row" }}>
            <button className="nav-btn" onClick={() => router.push("/improve")}
              style={{ background: "transparent", border: `1px solid ${ACCENT}`, color: ACCENT, fontWeight: 700 }}>
              → Improvement Guide
            </button>
            <button className="nav-btn" onClick={() => router.push("/pitch")}
              style={{ background: ACCENT, color: "#050505", border: "none", fontWeight: 700 }}>
              → Generate Pitch Deck
            </button>
          </div>

        </div>
      </main>
    </>
  );
}