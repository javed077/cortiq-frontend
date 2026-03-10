"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";

const ACCENT  = "#C8FF00";
const RED     = "#FF4444";
const YELLOW  = "#FFB800";
const CYAN    = "#00E5FF";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

function runway(budget: number, burn: number) {
  return burn <= 0 ? 36 : Math.min(36, budget / burn);
}

function buildSeries(budget: number, burn: number, growth: number, months = 36) {
  const rows = [];
  let cash = budget;
  let b    = burn;
  for (let i = 0; i <= months; i++) {
    rows.push({ month: `M${i}`, cash: Math.max(0, Math.round(cash)), burn: Math.round(b) });
    cash -= b;
    b     = b * (1 - growth / 100);   // growth = burn reduction %
    if (cash <= 0) break;
  }
  return rows;
}

// ── custom tooltip ─────────────────────────────────────────────────────────────

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0D0D0D", border: "1px solid rgba(200,255,0,0.2)", padding: "10px 14px", borderRadius: 8, fontFamily: "'Space Mono',monospace", fontSize: 11 }}>
      <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

// ── slider ────────────────────────────────────────────────────────────────────

function Slider({ label, value, min, max, step = 1, onChange, format = (v: number) => String(v), color = ACCENT }: any) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color, fontWeight: 700 }}>{format(value)}</span>
      </div>
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        {/* track */}
        <div style={{ position: "absolute", left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }} />
        {/* fill */}
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 4, background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}60` }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: 20, margin: 0 }}
        />
        {/* thumb */}
        <div style={{ position: "absolute", left: `calc(${pct}% - 8px)`, width: 16, height: 16, borderRadius: "50%", background: "#0D0D0D", border: `2px solid ${color}`, boxShadow: `0 0 8px ${color}80`, pointerEvents: "none", transition: "left 0.05s" }} />
      </div>
    </div>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────

function Stat({ label, value, sub, color = "white" }: any) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function SimulatePage() {
  const router = useRouter();

  // pull saved form if available
  const [budget, setBudget]   = useState(500_000);
  const [burn,   setBurn]     = useState(25_000);
  const [growth, setGrowth]   = useState(0);       // % burn reduction per month

  // scenario B toggles
  const [budgetB, setBudgetB] = useState(500_000);
  const [burnB,   setBurnB]   = useState(20_000);
  const [growthB, setGrowthB] = useState(5);
  const [compare, setCompare] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cortiq_form");
    if (saved) {
      const f = JSON.parse(saved);
      if (f.available_budget) { const b = Number(f.available_budget); setBudget(b); setBudgetB(b); }
      if (f.monthly_burn)     { const b = Number(f.monthly_burn);     setBurn(b);   setBurnB(Math.max(1000, b - 5000)); }
    }
  }, []);

  const seriesA = buildSeries(budget, burn, growth);
  const seriesB = buildSeries(budgetB, burnB, growthB);
  const rvwA    = runway(budget, burn);
  const rvwB    = runway(budgetB, burnB);

  // merge series for comparison chart
  const merged = Array.from({ length: Math.max(seriesA.length, seriesB.length) }, (_, i) => ({
    month:  `M${i}`,
    cashA:  seriesA[i]?.cash  ?? 0,
    cashB:  seriesB[i]?.cash  ?? 0,
  }));

  const runwayMonthA = seriesA.length - 1;
  const runwayMonthB = seriesB.length - 1;

  const statusColor = (r: number) => r > 18 ? ACCENT : r > 9 ? YELLOW : RED;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050505; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scanline { 0% { transform:translateY(-100%); } 100% { transform:translateY(100vh); } }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .panel { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:24px; }
        .panel:hover { border-color:rgba(255,255,255,0.11); transition:border-color 0.25s; }
        .tag { display:inline-block; padding:3px 10px; background:rgba(200,255,0,0.10); border:1px solid rgba(200,255,0,0.25); border-radius:4px; font-family:'Space Mono',monospace; font-size:9px; color:${ACCENT}; letter-spacing:0.15em; text-transform:uppercase; }
        .toggle { display:inline-flex; border:1px solid rgba(255,255,255,0.1); border-radius:8px; overflow:hidden; }
        .toggle-btn { padding:7px 16px; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.1em; cursor:pointer; border:none; transition:all 0.2s; }
        .back-btn { display:inline-flex; align-items:center; gap:8px; background:none; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); border-radius:8px; padding:8px 14px; cursor:pointer; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.15em; transition:all 0.2s; }
        .back-btn:hover { border-color:rgba(255,255,255,0.25); color:white; }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: "40px 24px", position: "relative" }}>
        {/* grid bg */}
        <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* header */}
          <div className="fade-up" style={{ marginBottom: 40 }}>
            <button className="back-btn" onClick={() => router.push("/")} style={{ marginBottom: 28 }}>← Dashboard</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>◎</span>
              </div>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>CORTIQ · BURN RATE SIMULATOR</span>
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              Runway &<br /><span style={{ color: ACCENT }}>Burn Simulator</span>
            </h1>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
              Drag the sliders to model your cash runway in real-time
            </p>
          </div>

          {/* scenario toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div className="toggle">
              <button className="toggle-btn" onClick={() => setCompare(false)} style={{ background: !compare ? ACCENT : "transparent", color: !compare ? "#050505" : "rgba(255,255,255,0.4)" }}>
                Single Scenario
              </button>
              <button className="toggle-btn" onClick={() => setCompare(true)} style={{ background: compare ? ACCENT : "transparent", color: compare ? "#050505" : "rgba(255,255,255,0.4)" }}>
                Compare A vs B
              </button>
            </div>
          </div>

          {/* sliders + stats */}
          <div style={{ display: "grid", gridTemplateColumns: compare ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 16 }}>

            {/* scenario A */}
            <div className="panel fade-up" style={{ animationDelay: "0.05s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <span className="tag">Scenario {compare ? "A" : "Current"}</span>
                {compare && <div style={{ width: 10, height: 10, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <Slider label="Starting Budget" value={budget} min={10000} max={5000000} step={10000} onChange={setBudget} format={fmt} color={ACCENT} />
                <Slider label="Monthly Burn" value={burn} min={1000} max={500000} step={1000} onChange={setBurn} format={fmt} color={RED} />
                <Slider label="Burn Reduction / Month %" value={growth} min={0} max={20} step={0.5} onChange={setGrowth} format={(v: number) => `${v}%`} color={CYAN} />
              </div>
            </div>

            {/* scenario B */}
            {compare && (
              <div className="panel fade-up" style={{ animationDelay: "0.1s", borderColor: "rgba(0,229,255,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <span className="tag" style={{ background: "rgba(0,229,255,0.1)", borderColor: "rgba(0,229,255,0.3)", color: CYAN }}>Scenario B</span>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: CYAN, boxShadow: `0 0 6px ${CYAN}` }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  <Slider label="Starting Budget" value={budgetB} min={10000} max={5000000} step={10000} onChange={setBudgetB} format={fmt} color={CYAN} />
                  <Slider label="Monthly Burn" value={burnB} min={1000} max={500000} step={1000} onChange={setBurnB} format={fmt} color={RED} />
                  <Slider label="Burn Reduction / Month %" value={growthB} min={0} max={20} step={0.5} onChange={setGrowthB} format={(v: number) => `${v}%`} color={CYAN} />
                </div>
              </div>
            )}
          </div>

          {/* stat row */}
          <div style={{ display: "grid", gridTemplateColumns: compare ? "repeat(4,1fr)" : "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
            <Stat label="Runway A" value={`${runwayMonthA}mo`} sub={runwayMonthA >= 36 ? "36+ months" : `${fmt(budget - burn * runwayMonthA)} left`} color={statusColor(runwayMonthA)} />
            <Stat label="Monthly Burn A" value={fmt(burn)} sub={`${fmt(burn * 12)}/yr`} color={RED} />
            <Stat label="Break-even Units" value={burn > 0 && (localStorage.getItem("cortiq_form") ? JSON.parse(localStorage.getItem("cortiq_form")!).pricing : 0) > 0
              ? Math.ceil(burn / Number(JSON.parse(localStorage.getItem("cortiq_form") || "{}").pricing || 1)).toLocaleString()
              : "—"} sub="units/mo needed" color={YELLOW} />
            {compare && <Stat label="Runway B" value={`${runwayMonthB}mo`} sub={`${runwayMonthB - runwayMonthA > 0 ? "+" : ""}${runwayMonthB - runwayMonthA}mo vs A`} color={statusColor(runwayMonthB)} />}
          </div>

          {/* chart */}
          <div className="panel fade-up" style={{ animationDelay: "0.15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <span className="tag">Cash Runway Chart</span>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                  Projected cash balance over 36 months
                </p>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {[["A", ACCENT], compare ? ["B", CYAN] : null].filter(Boolean).map(([lbl, c]: any) => (
                  <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 20, height: 3, background: c, borderRadius: 2 }} />
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Scenario {lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={compare ? merged : seriesA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CYAN} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.1)" tick={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fill: "rgba(255,255,255,0.25)" }} interval={2} />
                  <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fill: "rgba(255,255,255,0.25)" }} tickFormatter={v => fmt(v)} width={60} />
                  <Tooltip content={<ChartTip />} />
                  {/* zero line */}
                  <ReferenceLine y={0} stroke={RED} strokeDasharray="4 4" strokeOpacity={0.4} />
                  {compare ? (
                    <>
                      <Area type="monotone" dataKey="cashA" name="Cash A" stroke={ACCENT} strokeWidth={2} fill="url(#gradA)" dot={false} />
                      <Area type="monotone" dataKey="cashB" name="Cash B" stroke={CYAN}  strokeWidth={2} fill="url(#gradB)" dot={false} />
                    </>
                  ) : (
                    <Area type="monotone" dataKey="cash" name="Cash" stroke={ACCENT} strokeWidth={2.5} fill="url(#gradA)" dot={false} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* insight panel */}
          <div className="panel fade-up" style={{ animationDelay: "0.2s", marginTop: 16, borderColor: runwayMonthA < 9 ? "rgba(255,68,68,0.2)" : "rgba(200,255,0,0.12)", background: runwayMonthA < 9 ? "rgba(255,68,68,0.04)" : "rgba(200,255,0,0.03)" }}>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={{ fontSize: 20, color: runwayMonthA < 9 ? RED : ACCENT }}>
                {runwayMonthA < 6 ? "⚠" : runwayMonthA < 12 ? "◎" : "⬡"}
              </span>
              <div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: runwayMonthA < 9 ? RED : ACCENT, textTransform: "uppercase", marginBottom: 6 }}>
                  {runwayMonthA < 6 ? "Critical" : runwayMonthA < 12 ? "Warning" : "Analysis"}
                </div>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.8, color: "rgba(255,255,255,0.65)" }}>
                  {runwayMonthA < 6
                    ? `At $${burn.toLocaleString()}/mo burn your ${runwayMonthA}-month runway is critically short. You need to raise, cut burn by ${Math.round((1 - 6 / (budget / burn)) * 100)}%, or generate $${(burn - budget / 6).toLocaleString()} in monthly revenue immediately.`
                    : runwayMonthA < 12
                    ? `${runwayMonthA} months of runway gives you limited time to reach milestones. Consider starting fundraising now and targeting a 15-20% burn reduction to extend to 18+ months.`
                    : `${runwayMonthA} months of runway is healthy. Focus on growth milestones over the next ${Math.round(runwayMonthA * 0.6)} months before your next raise.`
                  }
                  {compare && ` Scenario B extends runway by ${runwayMonthB - runwayMonthA} months, saving ${fmt((burn - burnB) * Math.min(runwayMonthA, runwayMonthB))} in total burn.`}
                </p>
              </div>
            </div>
          </div>

          {/* footer */}
          <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em" }}>CORTIQ © 2025</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>NOT FINANCIAL ADVICE</span>
          </div>
        </div>
      </main>
    </>
  );
}