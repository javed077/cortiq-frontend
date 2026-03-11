"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

type ResultType = {
  health_score: number;
  risk_score: number;
  runway_months: number;
  market_health: number;
  competition_health: number;
  execution_health: number;
  finance_health: number;
  growth_health: number;
  biggest_problem: string;
  improvements: string[];
  insight: string;
};

const ACCENT = "#C8FF00"; // acid green
const DIM = "rgba(200,255,0,0.12)";

/* ── tiny animated counter ── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 40);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(start);
    }, 18);
    return () => clearInterval(id);
  }, [target]);
  return <>{val}{suffix}</>;
}

/* ── radial arc gauge ── */
function ArcGauge({ value, label, size = 100 }: { value: number; label: string; size?: number }) {
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75; // 270° sweep
  const filled = arc * (value / 100);
  const rotation = -225;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {/* track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={size * 0.06}
          strokeDasharray={`${arc} ${circ}`}
          strokeLinecap="round"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
        />
        {/* fill */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={value > 65 ? ACCENT : value > 35 ? "#FFB800" : "#FF4444"}
          strokeWidth={size * 0.06}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)",
            filter: `drop-shadow(0 0 6px ${value > 65 ? ACCENT : value > 35 ? "#FFB800" : "#FF4444"})`,
          }}
        />
        <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={size * 0.2} fontFamily="'Space Mono', monospace" fontWeight="700">
          {value}
        </text>
      </svg>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

/* ── custom tooltip for chart ── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0A0A0A", border: `1px solid ${ACCENT}33`, padding: "8px 14px", borderRadius: 8, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
      <p style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
      <p style={{ color: ACCENT }}>${Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
};

const InputField = ({ label, value, onChange, type = "text" }: any) => (
  <div style={{ position: "relative" }}>
    <label style={{
      display: "block", fontFamily: "'Space Mono', monospace",
      fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)",
      textTransform: "uppercase", marginBottom: 6
    }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8, padding: "11px 14px",
        color: "white", fontSize: 13,
        fontFamily: "'Space Mono', monospace",
        outline: "none", boxSizing: "border-box",
        transition: "border-color 0.2s",
      }}
      onFocus={e => (e.target.style.borderColor = ACCENT + "80")}
      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
    />
  </div>
);

export default function Home() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const [form, setForm] = useState<any>({
    idea: "", customer: "", geography: "", tam: "",
    competitors: "", pricing: "", cac: "", monthly_burn: "",
    current_revenue: "", available_budget: "", team_size: "",
    founder_experience: "", situation: "",
  });

  const [result, setResult] = useState<ResultType | null>(null);
  const [investorScore, setInvestorScore] = useState<any>(null);
  const [successProb, setSuccessProb] = useState<number | null>(null);
  const [marketResearch, setMarketResearch] = useState<any>(null);
  const [strategy, setStrategy] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("cortiq_form");
    if (saved) setForm(JSON.parse(saved));
  }, []);

  // blinking cursor tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 600);
    return () => clearInterval(id);
  }, []);

  const updateField = (field: string, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    localStorage.setItem("cortiq_form", JSON.stringify(updated));
  };

  const handleAnalyze = async () => {
    setError("");
    if (!form.idea || !form.customer || !form.tam || !form.available_budget || !form.team_size) {
      setError("⚠  Fill required fields: idea, customer, TAM, budget, team size");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        idea: form.idea, customer: form.customer, geography: form.geography,
        tam: Number(form.tam) || 1,
        competitors: form.competitors ? form.competitors.split(",").map((c: string) => c.trim()) : [],
        pricing: Number(form.pricing) || 0, cac: Number(form.cac) || 0,
        monthly_burn: Number(form.monthly_burn) || 0,
        current_revenue: Number(form.current_revenue) || 0,
        available_budget: Number(form.available_budget) || 1,
        team_size: Number(form.team_size) || 1,
        founder_experience: form.founder_experience || "first_time",
        situation: form.situation,
      };

      const res = await fetch(`${API}/dashboard/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);

      const [inv, research, strat] = await Promise.all([
        fetch(`${API}/investor-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
        fetch(`${API}/market-research`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: form.idea }) }).then(r => r.json()),
        fetch(`${API}/strategy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: form.idea, metrics: data }) }).then(r => r.json()),
      ]);

      setInvestorScore(inv);
      setMarketResearch(research);
      setStrategy(strat.strategy || []);
      setSuccessProb(Math.round(
        data.market_health * 0.30 + data.execution_health * 0.25 +
        data.finance_health * 0.20 + data.growth_health * 0.15 +
        data.competition_health * 0.10
      ));
    } catch (err) {
      console.error(err);
      setError("Analysis failed — check your connection");
    }
    setLoading(false);
  };

  const runwayData = result && Number(form.monthly_burn) > 0
    ? Array.from({ length: 12 }, (_, i) => ({
      month: `M${i + 1}`,
      cash: Math.max(0, Number(form.available_budget) - Number(form.monthly_burn) * i),
    }))
    : [];

  const fields = [
    { key: "idea", label: "Startup Idea *" },
    { key: "customer", label: "Target Customer *" },
    { key: "geography", label: "Geography" },
    { key: "tam", label: "Total Addressable Market ($) *" },
    { key: "competitors", label: "Competitors (comma-separated)" },
    { key: "pricing", label: "Product Price ($)" },
    { key: "cac", label: "Customer Acquisition Cost ($)" },
    { key: "monthly_burn", label: "Monthly Burn ($)" },
    { key: "current_revenue", label: "Current Revenue ($)" },
    { key: "available_budget", label: "Available Budget ($) *" },
    { key: "team_size", label: "Team Size *" },
    { key: "founder_experience", label: "Founder Experience" },
    { key: "situation", label: "Startup Situation" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050505; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(200,255,0,0.3); }
          70%  { box-shadow: 0 0 0 12px rgba(200,255,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(200,255,0,0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 28px;
        }
        .card:hover {
          border-color: rgba(255,255,255,0.12);
          transition: border-color 0.3s;
        }
        .analyze-btn {
          width: 100%; padding: 16px;
          background: ${ACCENT};
          color: #050505;
          font-family: 'Space Mono', monospace;
          font-weight: 700; font-size: 13px;
          letter-spacing: 0.15em; text-transform: uppercase;
          border: none; border-radius: 10px; cursor: pointer;
          transition: all 0.2s;
          animation: pulse-ring 2s infinite;
        }
        .analyze-btn:hover { background: #d4ff33; transform: translateY(-1px); }
        .analyze-btn:disabled { background: #2a2a2a; color: #555; cursor: not-allowed; animation: none; transform: none; }
        .improve-btn {
          width: 100%; padding: 16px;
          background: transparent;
          color: ${ACCENT};
          font-family: 'Space Mono', monospace;
          font-weight: 700; font-size: 13px;
          letter-spacing: 0.15em; text-transform: uppercase;
          border: 1px solid ${ACCENT}; border-radius: 10px; cursor: pointer;
          transition: all 0.2s;
        }
        .improve-btn:hover { background: ${ACCENT}15; }
        .tag {
          display: inline-block;
          padding: 4px 10px;
          background: ${DIM};
          border: 1px solid ${ACCENT}33;
          border-radius: 4px;
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: ${ACCENT};
          letter-spacing: 0.1em;
        }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: "40px 24px", position: "relative", overflow: "hidden" }}>

        {/* bg grid */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0,
          backgroundImage: `linear-gradient(rgba(200,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(200,255,0,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }} />

        {/* scanline */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(200,255,0,0.15), transparent)",
          animation: "scanline 8s linear infinite", zIndex: 0, pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* ── HEADER ── */}
          <div className="fade-up" style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 16 }}>⬡</span>
              </div>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.35em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                  CORTIQ · STARTUP INTELLIGENCE TERMINAL
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: ACCENT, letterSpacing: "0.15em" }}>ONLINE</span>
              </div>
            </div>

            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              Strategic Analysis<br />
              <span style={{ color: ACCENT }}>Intelligence Engine</span>
            </h1>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 12, letterSpacing: "0.05em" }}>
              AI-powered startup diagnostics · risk modeling · investor readiness
            </p>
          </div>

          {/* ── FORM ── */}
          <div className="card fade-up" style={{ animationDelay: "0.1s", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <span className="tag">INPUT</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                · fields marked * are required
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {fields.map(f => (
                <InputField key={f.key} label={f.label} value={form[f.key]} onChange={(v: string) => updateField(f.key, v)} />
              ))}
            </div>
          </div>

          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
            style={{ marginBottom: 12 }}
          >
            {loading
              ? `Analyzing${tick % 2 === 0 ? "..." : "   "}`
              : "→  Run Strategic Analysis"}
          </button>

          {error && (
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#FF6B6B", marginBottom: 16, padding: "10px 14px", background: "rgba(255,107,107,0.08)", borderRadius: 8, border: "1px solid rgba(255,107,107,0.2)" }}>
              {error}
            </p>
          )}

          {/* ── RESULTS ── */}
          {result && (
            <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 16 }}>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="tag">ANALYSIS COMPLETE</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* ROW 1: Success prob + Investor score */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {successProb !== null && (
                  <div className="card fade-up" style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>Success Probability</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 72, fontWeight: 800, color: ACCENT, lineHeight: 1, textShadow: `0 0 40px ${ACCENT}60` }}>
                      <Counter target={successProb} suffix="%" />
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 10 }}>composite weighted score</div>
                  </div>
                )}

                {investorScore && (
                  <div className="card fade-up" style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>Investor Readiness</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 72, fontWeight: 800, color: "white", lineHeight: 1 }}>
                      <Counter target={investorScore.investor_score} />
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: ACCENT, marginTop: 10 }}>{investorScore.verdict}</div>
                  </div>
                )}
              </div>

              {/* ROW 2: Health gauges */}
              <div className="card fade-up">
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 24 }}>Health Metrics</div>
                <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
                  {[
                    ["Market", result.market_health],
                    ["Execution", result.execution_health],
                    ["Finance", result.finance_health],
                    ["Growth", result.growth_health],
                    ["Competition", result.competition_health],
                  ].map(([name, val]: any) => (
                    <ArcGauge key={name} value={val} label={name} size={110} />
                  ))}
                </div>
              </div>

              {/* ROW 3: Risk bar */}
              <div className="card fade-up">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Risk Index</div>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: result.risk_score > 60 ? "#FF6B6B" : ACCENT }}>
                    {result.risk_score}/100
                  </span>
                </div>
                <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    width: `${result.risk_score}%`,
                    background: result.risk_score > 60
                      ? "linear-gradient(90deg,#FFB800,#FF4444)"
                      : `linear-gradient(90deg,${ACCENT},#00e5ff)`,
                    boxShadow: `0 0 12px ${result.risk_score > 60 ? "#FF4444" : ACCENT}80`,
                    transition: "width 1s cubic-bezier(.4,0,.2,1)",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>LOW RISK</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>HIGH RISK</span>
                </div>
              </div>

              {/* ROW 4: Runway chart */}
              {runwayData.length > 0 && (
                <div className="card fade-up">
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 24 }}>
                    Runway Projection · {result.runway_months || "—"} months estimated
                  </div>
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <AreaChart data={runwayData}>
                        <defs>
                          <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.15)" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fill: "rgba(255,255,255,0.3)" }} />
                        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="cash" stroke={ACCENT} strokeWidth={2} fill="url(#cashGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ROW 5: Market research + Strategy side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {marketResearch && (
                  <div className="card fade-up">
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>Market Research</div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>MARKET SIZE</span>
                      <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: ACCENT, marginTop: 2 }}>{marketResearch.market_size}</p>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>GROWTH RATE</span>
                      <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, marginTop: 2 }}>{marketResearch.growth_rate}</p>
                    </div>
                    <div>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>COMPETITORS</span>
                      {(marketResearch.competitors || []).map((c: any, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: ACCENT, flexShrink: 0 }} />
                          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {strategy.length > 0 && (
                  <div className="card fade-up">
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>Strategic Recommendations</div>
                    {strategy.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: i < strategy.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, background: DIM,
                          border: `1px solid ${ACCENT}33`, display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Space Mono', monospace", fontSize: 9, color: ACCENT, flexShrink: 0,
                        }}>
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>{s}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Insight callout */}
              {result.insight && (
                <div className="card fade-up" style={{ borderColor: `${ACCENT}30`, background: `${ACCENT}06` }}>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, color: ACCENT }}>⬡</div>
                    <div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", marginBottom: 8 }}>Key Insight</div>
                      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>{result.insight}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Biggest problem */}
              {result.biggest_problem && (
                <div className="card fade-up" style={{ borderColor: "rgba(255,107,107,0.2)", background: "rgba(255,107,107,0.04)" }}>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, color: "#FF6B6B" }}>⚠</div>
                    <div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#FF6B6B", textTransform: "uppercase", marginBottom: 8 }}>Critical Risk</div>
                      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>{result.biggest_problem}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                className="improve-btn"
                onClick={() => {
                  localStorage.setItem("cortiq_result", JSON.stringify({ result, strategy, marketResearch, investorScore }));
                  router.push("/improve");
                }}
              >
                → How to Improve This Startup
              </button>

            </div>
          )}

          {/* footer */}
          <div style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em" }}>CORTIQ © 2025</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>AI-POWERED · NOT FINANCIAL ADVICE</span>
          </div>

        </div>
      </main>
    </>
  );
}
// ── ADD THIS FUNCTION inside your main page.tsx component ─────────────────────
// Call it right after you set your analysis results in state.
// Place it just before your return() statement.

function saveToHistory(result: any, formData: any) {
  if (!result?.health_score) return;

  const todayStr = new Date().toISOString().split("T")[0];

  // load existing history
  const existing: any[] = JSON.parse(localStorage.getItem("cortiq_history") || "[]");

  // don't double-save on the same day
  if (existing.length > 0 && existing[existing.length - 1].date === todayStr) {
    // update today's entry instead of adding a duplicate
    existing[existing.length - 1] = {
      date:               todayStr,
      health_score:       result.health_score       || 0,
      market_health:      result.market_health      || 0,
      execution_health:   result.execution_health   || 0,
      finance_health:     result.finance_health     || 0,
      growth_health:      result.growth_health      || 0,
      competition_health: result.competition_health || 0,
      runway_months:      result.runway_months      || 0,
      idea:               formData.idea             || "My Startup",
    };
  } else {
    existing.push({
      date:               todayStr,
      health_score:       result.health_score       || 0,
      market_health:      result.market_health      || 0,
      execution_health:   result.execution_health   || 0,
      finance_health:     result.finance_health     || 0,
      growth_health:      result.growth_health      || 0,
      competition_health: result.competition_health || 0,
      runway_months:      result.runway_months      || 0,
      idea:               formData.idea             || "My Startup",
    });
  }

  localStorage.setItem("cortiq_history", JSON.stringify(existing));

  // update streak
  const savedStreak = localStorage.getItem("cortiq_streak");
  const streak = savedStreak
    ? JSON.parse(savedStreak)
    : { current: 0, longest: 0, lastCheckin: "", totalCheckins: 0 };

  const lastDate = streak.lastCheckin;
  const daysDiff = lastDate
    ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
    : 999;

  if (daysDiff > 0) { // not already checked in today
    let current = daysDiff <= 7 ? streak.current + 1 : 1;
    const longest = Math.max(streak.longest, current);
    const updated = {
      current,
      longest,
      lastCheckin:   todayStr,
      totalCheckins: streak.totalCheckins + 1,
    };
    localStorage.setItem("cortiq_streak", JSON.stringify(updated));
  }
}

// ── WHERE TO CALL IT in page.tsx ───────────────────────────────────────────────
// Find your handleSubmit / analyze function where you call the API.
// After you receive the result and call setResult(...), add:
//
//   saveToHistory(data.result, formValues);
//
// Example — your existing code probably looks something like:
//
//   const [investorScore, marketResearch, strategy] = await Promise.all([...]);
//   setResult(data);
//   localStorage.setItem("cortiq_result", JSON.stringify({ result: data, ... }));
//   // ↓ ADD THIS LINE right here:
//   saveToHistory(data, formValues);
//
// That's it. The progress page reads cortiq_history automatically on mount.