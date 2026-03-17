"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

type ResultType = {
  health_score: number; risk_score: number; runway_months: number;
  market_health: number; competition_health: number; execution_health: number;
  finance_health: number; growth_health: number;
  biggest_problem: string; improvements: string[]; insight: string;
};

type GenomeModuleStatus = "idle" | "loading" | "done" | "error";

type GenomeModule = {
  id: string;
  label: string;
  icon: string;
  color: string;
  status: GenomeModuleStatus;
  content: string;
  open: boolean;
};

type GenomeSummary = {
  idea_score: string;
  biggest_risk: string;
  market_size: string;
  top_objection: string;
  competitor_gap: string;
  recommendation: string;
};

const ACCENT = "#C8FF00";
const DIM = "rgba(200,255,0,0.12)";

// Prompts live in the backend (_GENOME_PROMPTS in main.py) — frontend only needs display metadata
const MODULE_DEFS = [
  { id: "strategy",    label: "Business Strategy",  icon: "⬡", color: DIM },
  { id: "market",      label: "Market Sizing",       icon: "◈", color: "rgba(100,180,255,0.10)" },
  { id: "financial",   label: "Financial Model",     icon: "▦", color: "rgba(255,170,0,0.10)" },
  { id: "customer",    label: "Customer Psychology", icon: "◎", color: "rgba(200,100,255,0.10)" },
  { id: "competitive", label: "Competitor Intel",    icon: "◐", color: "rgba(255,80,80,0.10)" },
];

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

function ArcGauge({ value, label, size = 100 }: { value: number; label: string; size?: number }) {
  const r = size * 0.38, cx = size / 2, cy = size / 2 + 8;
  const circ = 2 * Math.PI * r, arc = circ * 0.75;
  const filled = arc * (value / 100), rotation = -225;
  const color = value > 65 ? ACCENT : value > 35 ? "#FFB800" : "#FF4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)"
          strokeWidth={size * 0.06} strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
          strokeWidth={size * 0.06} strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px`,
            transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)",
            filter: `drop-shadow(0 0 6px ${color})` }} />
        <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={size * 0.2} fontFamily="'Space Mono',monospace" fontWeight="700">{value}</text>
      </svg>
      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0A0A0A", border: `1px solid ${ACCENT}33`, padding: "8px 14px", borderRadius: 8, fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
      <p style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
      <p style={{ color: ACCENT }}>${Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
};

const InputField = ({ label, value, onChange }: any) => (
  <div>
    <label style={{ display: "block", fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
    <input type="text" value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "13px 14px", color: "white", fontSize: 16, fontFamily: "'Space Mono',monospace", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s", minHeight: 48 }}
      onFocus={e => (e.target.style.borderColor = ACCENT + "80")}
      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
  </div>
);

// All Genome calls go through the backend — API key stays server-side
// Fetch with a hard timeout — prevents any call from hanging forever
async function fetchWithTimeout(url: string, options: RequestInit, ms = 30000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callGenomeModule(API: string, idea: string, customer: string, module: string): Promise<string> {
  const res = await fetchWithTimeout(`${API}/genome/module`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea, customer, module }),
  }, 45000);
  const data = await res.json();
  return data.content ?? "";
}

async function callGenomeSummary(API: string, idea: string, moduleResults: Record<string, string>): Promise<any> {
  const res = await fetchWithTimeout(`${API}/genome/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idea,
      strategy:    moduleResults.strategy    ?? "",
      market:      moduleResults.market      ?? "",
      financial:   moduleResults.financial   ?? "",
      customer:    moduleResults.customer    ?? "",
      competitive: moduleResults.competitive ?? "",
    }),
  }, 30000);
  return res.json();
}

export default function Home() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const [form, setForm] = useState<any>({
    idea: "", customer: "", geography: "", tam: "", competitors: "",
    pricing: "", cac: "", monthly_burn: "", current_revenue: "",
    available_budget: "", team_size: "", founder_experience: "", situation: "",
  });
  const [result, setResult] = useState<ResultType | null>(null);
  const [investorScore, setInvestorScore] = useState<any>(null);
  const [successProb, setSuccessProb] = useState<number | null>(null);
  const [marketResearch, setMarketResearch] = useState<any>(null);
  const [strategy, setStrategy] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Genome state
  const [genomeModules, setGenomeModules] = useState<GenomeModule[]>(
    MODULE_DEFS.map(m => ({ ...m, status: "idle" as GenomeModuleStatus, content: "", open: false }))
  );
  const [genomeSummary, setGenomeSummary] = useState<GenomeSummary | null>(null);
  const [genomeSummaryLoading, setGenomeSummaryLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cortiq_form");
    if (saved) setForm(JSON.parse(saved));
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 600);
    return () => clearInterval(id);
  }, []);

  const updateField = (field: string, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    localStorage.setItem("cortiq_form", JSON.stringify(updated));
  };

  function saveToHistory(data: any, formData: any) {
    if (!data?.health_score) return;
    const todayStr = new Date().toISOString().split("T")[0];
    const existing: any[] = JSON.parse(localStorage.getItem("cortiq_history") || "[]");
    const entry = {
      date: todayStr,
      health_score: data.health_score || 0,
      market_health: data.market_health || 0,
      execution_health: data.execution_health || 0,
      finance_health: data.finance_health || 0,
      growth_health: data.growth_health || 0,
      competition_health: data.competition_health || 0,
      runway_months: data.runway_months || 0,
      idea: formData.idea || "My Startup",
    };
    if (existing.length > 0 && existing[existing.length - 1].date === todayStr) {
      existing[existing.length - 1] = entry;
    } else {
      existing.push(entry);
    }
    localStorage.setItem("cortiq_history", JSON.stringify(existing));
    const savedStreak = localStorage.getItem("cortiq_streak");
    const streak = savedStreak ? JSON.parse(savedStreak) : { current: 0, longest: 0, lastCheckin: "", totalCheckins: 0 };
    const daysDiff = streak.lastCheckin
      ? Math.floor((Date.now() - new Date(streak.lastCheckin).getTime()) / 86400000)
      : 999;
    if (daysDiff > 0) {
      const current = daysDiff <= 7 ? streak.current + 1 : 1;
      localStorage.setItem("cortiq_streak", JSON.stringify({
        current, longest: Math.max(streak.longest, current),
        lastCheckin: todayStr, totalCheckins: streak.totalCheckins + 1,
      }));
    }
  }

  async function runGenomeAnalysis(idea: string, customer: string) {
    console.log("[Genome] Starting analysis for:", idea);
    setGenomeModules(MODULE_DEFS.map(m => ({ ...m, status: "loading" as GenomeModuleStatus, content: "", open: false })));
    setGenomeSummary(null);
    setGenomeSummaryLoading(false);

    const modulePromises = MODULE_DEFS.map(async (mod) => {
      try {
        console.log(`[Genome] Calling module: ${mod.id} at ${API}/genome/module`);
        const content = await callGenomeModule(API, idea, customer, mod.id);
        console.log(`[Genome] Module done: ${mod.id}, length: ${content.length}`);
        setGenomeModules(prev =>
          prev.map(m => m.id === mod.id ? { ...m, status: "done" as GenomeModuleStatus, content, open: true } : m)
        );
        return { id: mod.id, content };
      } catch (err) {
        console.error(`[Genome] Module failed: ${mod.id}`, err);
        setGenomeModules(prev =>
          prev.map(m => m.id === mod.id ? {
            ...m,
            status: "error" as GenomeModuleStatus,
            content: `Backend error: ${err instanceof Error ? err.message : String(err)}`,
            open: true,
          } : m)
        );
        return { id: mod.id, content: "" };
      }
    });

    const results = await Promise.all(modulePromises);
    const moduleMap: Record<string, string> = {};
    results.forEach(r => { if (r.content) moduleMap[r.id] = r.content; });

    console.log("[Genome] All modules done, running summary...");
    setGenomeSummaryLoading(true);
    try {
      const summary = await callGenomeSummary(API, idea, moduleMap);
      console.log("[Genome] Summary result:", summary);
      setGenomeSummary(summary?.idea_score ? summary : {
        idea_score: "—",
        biggest_risk: "See strategy module",
        market_size: "See market module",
        top_objection: "See customer module",
        competitor_gap: "See competitor module",
        recommendation: "Review the module outputs above for detailed recommendations.",
      });
    } catch (err) {
      console.error("[Genome] Summary failed:", err);
      setGenomeSummary({
        idea_score: "—",
        biggest_risk: "See strategy module",
        market_size: "See market module",
        top_objection: "See customer module",
        competitor_gap: "See competitor module",
        recommendation: "Review the module outputs above for detailed recommendations.",
      });
    }
    setGenomeSummaryLoading(false);
  }

  const handleAnalyze = async () => {
    setError("");
    if (!form.idea || !form.customer || !form.tam || !form.available_budget || !form.team_size) {
      setError("⚠  Fill required fields: idea, customer, TAM, budget, team size");
      return;
    }
    setLoading(true);
    setGenomeModules(MODULE_DEFS.map(m => ({ ...m, status: "idle" as GenomeModuleStatus, content: "", open: false })));
    setGenomeSummary(null);

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

      // Genome runs fully independently — never touches loading state
      // Set modules to loading immediately so section appears right away
      setGenomeModules(MODULE_DEFS.map(m => ({ ...m, status: "loading" as GenomeModuleStatus, content: "", open: false })));
      runGenomeAnalysis(form.idea, form.customer).catch(console.error);

      // Core analysis — compute scores locally first so results show even if Groq is slow
      const runway = payload.monthly_burn > 0
        ? Math.round(payload.available_budget / payload.monthly_burn * 10) / 10
        : 24;
      const fallbackResult = {
        health_score: 50, risk_score: 50, runway_months: runway,
        market_health: 50, competition_health: 50, execution_health: 50,
        finance_health: 50, growth_health: 50,
        biggest_problem: "", improvements: [], insight: "",
      };

      let data: any = fallbackResult;
      try {
        // Get Supabase session token
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? "";

        const res = await fetchWithTimeout(`${API}/dashboard/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }, 30000);
        data = await res.json();

        // Store idea_id if returned
        if (data.idea_id) {
          localStorage.setItem("cortiq_last_idea_id", data.idea_id);
        }
      } catch (e) {
        console.error("dashboard/analyze failed:", e);
        setError("Backend unreachable — showing estimated scores. Check that your server is running.");
      }
      setResult(data);
      saveToHistory(data, form);
      setSuccessProb(Math.round(
        data.market_health * 0.30 + data.execution_health * 0.25 +
        data.finance_health * 0.20 + data.growth_health * 0.15 + data.competition_health * 0.10
      ));

      // Secondary calls — all optional, fail silently
      const [inv, research, strat] = await Promise.allSettled([
        fetchWithTimeout(`${API}/investor-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, 20000).then(r => r.json()),
        fetchWithTimeout(`${API}/market-research`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: form.idea }) }, 20000).then(r => r.json()),
        fetchWithTimeout(`${API}/strategy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: form.idea, metrics: data }) }, 20000).then(r => r.json()),
      ]);

      if (inv.status === "fulfilled")      setInvestorScore(inv.value);
      if (research.status === "fulfilled") setMarketResearch(research.value);
      if (strat.status === "fulfilled")    setStrategy(strat.value?.strategy || []);

      localStorage.setItem("cortiq_result", JSON.stringify({
        result: data,
        strategy: strat.status === "fulfilled" ? strat.value?.strategy || [] : [],
        marketResearch: research.status === "fulfilled" ? research.value : {},
        investorScore: inv.status === "fulfilled" ? inv.value : {},
      }));
    } catch (err) {
      console.error("handleAnalyze unexpected error:", err);
      setError("Something went wrong — please try again");
    } finally {
      // Always unblock the button, no matter what
      setLoading(false);
    }
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

  const col2 = isMobile ? "1fr" : "1fr 1fr";
  // Show genome section as soon as modules start loading (before result even returns)
  const genomeActive = genomeModules.some(m => m.status !== "idle");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #050505; overflow-x: hidden; width: 100%; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scanline { 0% { transform:translateY(-100%); } 100% { transform:translateY(100vh); } }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(200,255,0,0.3)} 70%{box-shadow:0 0 0 12px rgba(200,255,0,0)} 100%{box-shadow:0 0 0 0 rgba(200,255,0,0)} }
        @keyframes shimmer { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .fade-up { animation: fadeUp 0.5s ease both; }

        .card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 28px;
        }
        .card:hover { border-color: rgba(255,255,255,0.12); transition: border-color 0.3s; }

        .analyze-btn {
          width: 100%; min-height: 52px; padding: 16px;
          background: ${ACCENT}; color: #050505;
          font-family: 'Space Mono', monospace; font-weight: 700; font-size: 13px;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: none; border-radius: 12px; cursor: pointer;
          transition: all 0.2s; animation: pulse-ring 2s infinite;
          -webkit-tap-highlight-color: transparent;
        }
        .analyze-btn:hover { background: #d4ff33; transform: translateY(-1px); }
        .analyze-btn:active { transform: scale(0.98); }
        .analyze-btn:disabled { background: #2a2a2a; color: #555; cursor: not-allowed; animation: none; transform: none; }

        .improve-btn {
          width: 100%; min-height: 52px; padding: 16px;
          background: transparent; color: ${ACCENT};
          font-family: 'Space Mono', monospace; font-weight: 700; font-size: 13px;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: 1px solid ${ACCENT}; border-radius: 12px; cursor: pointer;
          transition: all 0.2s; -webkit-tap-highlight-color: transparent;
        }
        .improve-btn:hover { background: ${ACCENT}15; }
        .improve-btn:active { transform: scale(0.98); }

        .tag {
          display: inline-block; padding: 4px 10px;
          background: ${DIM}; border: 1px solid ${ACCENT}33;
          border-radius: 4px; font-family: 'Space Mono', monospace;
          font-size: 10px; color: ${ACCENT}; letter-spacing: 0.1em;
        }

        .genome-module-header {
          cursor: pointer; display: flex; align-items: center; gap: 12px;
          padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
          user-select: none; transition: background 0.15s;
        }
        .genome-module-header:hover { background: rgba(255,255,255,0.02); }

        .genome-module-body { padding: 18px 20px; display: none; }
        .genome-module-body.open { display: block; }
        .genome-module-body pre {
          font-family: 'Space Mono', monospace; font-size: 11px;
          line-height: 1.8; color: rgba(255,255,255,0.72);
          white-space: pre-wrap; word-break: break-word;
        }

        .skel {
          height: 11px; background: rgba(255,255,255,0.06);
          border-radius: 4px; margin-bottom: 9px;
          animation: shimmer 1.4s infinite;
        }

        @media (max-width: 768px) {
          .card { padding: 18px; border-radius: 12px; }
          .gauges-row { gap: 8px !important; }
          .gauges-row > * { flex: 0 0 calc(33% - 8px) !important; }
        }
        @media (max-width: 480px) {
          .gauges-row > * { flex: 0 0 calc(50% - 8px) !important; }
        }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: isMobile ? "24px 16px" : "40px 24px", position: "relative", overflow: "hidden" }}>

        {/* Background grid */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: `linear-gradient(rgba(200,255,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.03) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none" }} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation: "scanline 8s linear infinite", zIndex: 0, pointerEvents: "none" }} />

        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* ── HEADER ── */}
          <div className="fade-up" style={{ marginBottom: isMobile ? 32 : 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 16 }}>⬡</span>
              </div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: isMobile ? 8 : 9, letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                CORTIQ · STARTUP INTELLIGENCE
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: ACCENT, letterSpacing: "0.15em" }}>ONLINE</span>
              </div>
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? "clamp(28px,8vw,36px)" : "clamp(32px,5vw,52px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              Strategic Analysis<br /><span style={{ color: ACCENT }}>Intelligence Engine</span>
            </h1>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.35)", marginTop: 12, letterSpacing: "0.03em", lineHeight: 1.6 }}>
              AI-powered startup diagnostics · risk modeling · investor readiness
            </p>
          </div>

          {/* ── FORM ── */}
          <div className="card fade-up" style={{ animationDelay: "0.1s", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span className="tag">INPUT</span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>* = required</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {fields.map(f => (
                <InputField key={f.key} label={f.label} value={form[f.key]} onChange={(v: string) => updateField(f.key, v)} />
              ))}
            </div>
          </div>

          <button className="analyze-btn" onClick={handleAnalyze} disabled={loading} style={{ marginBottom: 12 }}>
            {loading ? `Analyzing${tick % 2 === 0 ? "..." : "   "}` : "→  Run Strategic Analysis"}
          </button>

          {error && (
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#FF6B6B", marginBottom: 16, padding: "12px 16px", background: "rgba(255,107,107,0.08)", borderRadius: 8, border: "1px solid rgba(255,107,107,0.2)", lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          {/* ── RESULTS ── */}
          {result && (
            <div style={{ marginTop: isMobile ? 32 : 48, display: "flex", flexDirection: "column", gap: 14 }}>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span className="tag">ANALYSIS COMPLETE</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* Success probability + Investor readiness */}
              <div style={{ display: "grid", gridTemplateColumns: col2, gap: 14 }}>
                {successProb !== null && (
                  <div className="card fade-up" style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>Success Probability</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 56 : 72, fontWeight: 800, color: ACCENT, lineHeight: 1, textShadow: `0 0 40px ${ACCENT}60` }}>
                      <Counter target={successProb} suffix="%" />
                    </div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 10 }}>composite weighted score</div>
                  </div>
                )}
                {investorScore && (
                  <div className="card fade-up" style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>Investor Readiness</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 56 : 72, fontWeight: 800, color: "white", lineHeight: 1 }}>
                      <Counter target={investorScore.investor_score} />
                    </div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: ACCENT, marginTop: 10 }}>{investorScore.verdict}</div>
                  </div>
                )}
              </div>

              {/* Health gauges */}
              <div className="card fade-up">
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 20 }}>Health Metrics</div>
                <div className="gauges-row" style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
                  {[["Market", result.market_health], ["Execution", result.execution_health], ["Finance", result.finance_health], ["Growth", result.growth_health], ["Competition", result.competition_health]].map(([name, val]: any) => (
                    <ArcGauge key={name} value={val} label={name} size={isMobile ? 80 : 110} />
                  ))}
                </div>
              </div>

              {/* Risk bar */}
              <div className="card fade-up">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Risk Index</div>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: result.risk_score > 60 ? "#FF6B6B" : ACCENT }}>{result.risk_score}/100</span>
                </div>
                <div style={{ width: "100%", height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 5, width: `${result.risk_score}%`, background: result.risk_score > 60 ? "linear-gradient(90deg,#FFB800,#FF4444)" : `linear-gradient(90deg,${ACCENT},#00e5ff)`, boxShadow: `0 0 12px ${result.risk_score > 60 ? "#FF4444" : ACCENT}80`, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>LOW RISK</span>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>HIGH RISK</span>
                </div>
              </div>

              {/* Runway chart */}
              {runwayData.length > 0 && (
                <div className="card fade-up">
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 20 }}>
                    Runway Projection · {result.runway_months || "—"} months estimated
                  </div>
                  <div style={{ width: "100%", height: isMobile ? 160 : 200 }}>
                    <ResponsiveContainer>
                      <AreaChart data={runwayData}>
                        <defs>
                          <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.15)" tick={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={40} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="cash" stroke={ACCENT} strokeWidth={2} fill="url(#cashGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Market Research + Strategy */}
              <div style={{ display: "grid", gridTemplateColumns: col2, gap: 14 }}>
                {marketResearch && (
                  <div className="card fade-up">
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>Market Research</div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>MARKET SIZE</span>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: ACCENT, marginTop: 4 }}>{marketResearch.market_size}</p>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>GROWTH RATE</span>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, marginTop: 4 }}>{marketResearch.growth_rate}</p>
                    </div>
                    <div>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>COMPETITORS</span>
                      {(marketResearch.competitors || []).map((c: any, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: ACCENT, flexShrink: 0 }} />
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {strategy.length > 0 && (
                  <div className="card fade-up">
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>Strategic Recommendations</div>
                    {strategy.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: i < strategy.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <div style={{ width: 24, height: 24, minWidth: 24, borderRadius: 6, background: DIM, border: `1px solid ${ACCENT}33`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 9, color: ACCENT }}>
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>{s}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Key Insight */}
              {result.insight && (
                <div className="card fade-up" style={{ borderColor: `${ACCENT}30`, background: `${ACCENT}06` }}>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{ fontSize: 20, color: ACCENT, flexShrink: 0 }}>⬡</div>
                    <div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", marginBottom: 8 }}>Key Insight</div>
                      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: isMobile ? 11 : 12, lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>{result.insight}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Critical Risk */}
              {result.biggest_problem && (
                <div className="card fade-up" style={{ borderColor: "rgba(255,107,107,0.2)", background: "rgba(255,107,107,0.04)" }}>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{ fontSize: 20, color: "#FF6B6B", flexShrink: 0 }}>⚠</div>
                    <div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "#FF6B6B", textTransform: "uppercase", marginBottom: 8 }}>Critical Risk</div>
                      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: isMobile ? 11 : 12, lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>{result.biggest_problem}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              CORTIQ GENOME ENGINE
          ═══════════════════════════════════════════════════ */}
          {genomeActive && (
            <div style={{ marginTop: 12 }}>

              {/* Genome section header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }} />
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.25em", color: ACCENT, textTransform: "uppercase" }}>
                  Cortiq Genome Engine
                </span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${ACCENT}40, transparent)` }} />
              </div>

              {/* ── GENOME SUMMARY CARD ── */}
              <div style={{
                background: "rgba(200,255,0,0.03)",
                border: `1px solid ${ACCENT}28`,
                borderRadius: 16,
                padding: isMobile ? 20 : 28,
                marginBottom: 14,
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Top accent stripe */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}10)` }} />

                {/* Card header row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", marginBottom: 6 }}>
                      Startup Genome Report
                    </div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 17 : 21, fontWeight: 800, color: "white", lineHeight: 1.25, maxWidth: 480 }}>
                      {form.idea.length > 55 ? form.idea.slice(0, 55) + "…" : form.idea || "Your Startup"}
                    </div>
                  </div>

                  {genomeSummary ? (
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 4 }}>IDEA SCORE</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 38 : 50, fontWeight: 800, color: ACCENT, lineHeight: 1, textShadow: `0 0 30px ${ACCENT}50` }}>
                        {genomeSummary.idea_score}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div style={{ width: 16, height: 16, border: `2px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                        {genomeModules.every(m => m.status === "done") ? "Synthesizing…" : "Modules running…"}
                      </span>
                    </div>
                  )}
                </div>

                {/* 4 metric tiles */}
                {genomeSummary ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                      {[
                        { label: "Biggest Risk", value: genomeSummary.biggest_risk, color: "#FF6B6B" },
                        { label: "Market Size", value: genomeSummary.market_size, color: ACCENT },
                        { label: "Top Objection", value: genomeSummary.top_objection, color: "#FFB800" },
                        { label: "Competitor Gap", value: genomeSummary.competitor_gap, color: "#00CFFF" },
                      ].map(tile => (
                        <div key={tile.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                            {tile.label}
                          </div>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: isMobile ? 10 : 11, color: tile.color, lineHeight: 1.4, fontWeight: 700 }}>
                            {tile.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendation */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                        Recommendation
                      </div>
                      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.82)", lineHeight: 1.75 }}>
                        {genomeSummary.recommendation}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                      {[85, 65, 75, 55].map((w, i) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px" }}>
                          <div className="skel" style={{ width: "50%", marginBottom: 8 }} />
                          <div className="skel" style={{ width: `${w}%` }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "14px 16px" }}>
                      <div className="skel" style={{ width: "100%", height: 13, marginBottom: 10 }} />
                      <div className="skel" style={{ width: "85%" }} />
                    </div>
                  </>
                )}
              </div>

              {/* ── 5 MODULE ACCORDION CARDS ── */}
              {genomeModules.map((mod) => {
                const def = MODULE_DEFS.find(d => d.id === mod.id)!;
                const borderColor = mod.status === "error"
                  ? "rgba(255,107,107,0.25)"
                  : mod.status === "done"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.05)";
                return (
                  <div key={mod.id} style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${borderColor}`,
                    borderRadius: 12,
                    marginBottom: 8,
                    overflow: "hidden",
                    transition: "border-color 0.3s",
                  }}>
                    <div
                      className="genome-module-header"
                      onClick={() => setGenomeModules(prev =>
                        prev.map(m => m.id === mod.id ? { ...m, open: !m.open } : m)
                      )}
                    >
                      {/* Module icon */}
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: def.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, color: ACCENT }}>
                        {def.icon}
                      </div>

                      {/* Label */}
                      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "white", flex: 1 }}>
                        {mod.label}
                      </span>

                      {/* Status badge */}
                      {mod.status === "loading" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 14, height: 14, border: `2px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Analyzing</span>
                        </div>
                      )}
                      {mod.status === "done" && (
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, padding: "3px 9px", background: DIM, border: `1px solid ${ACCENT}33`, borderRadius: 10, color: ACCENT }}>
                          Done
                        </span>
                      )}
                      {mod.status === "error" && (
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, padding: "3px 9px", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: 10, color: "#FF6B6B" }}>
                          Error
                        </span>
                      )}

                      {/* Chevron */}
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginLeft: 8, display: "inline-block", transform: mod.open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                        ▶
                      </span>
                    </div>

                    <div className={`genome-module-body${mod.open ? " open" : ""}`}>
                      {mod.status === "loading" ? (
                        <div>
                          {[90, 72, 82, 58, 76, 62, 88].map((w, i) => (
                            <div key={i} className="skel" style={{ width: `${w}%`, animationDelay: `${i * 0.08}s` }} />
                          ))}
                        </div>
                      ) : (
                        <pre>{mod.content}</pre>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* ═══════════════════════════════════════════════════ */}

          {result && (
            <button className="improve-btn" onClick={() => router.push("/improve")}>
              → How to Improve This Startup
            </button>
          )}

          {/* Footer */}
          <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 8 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em" }}>CORTIQ © 2025</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>AI-POWERED · NOT FINANCIAL ADVICE</span>
          </div>

        </div>
      </main>
    </>
  );
}