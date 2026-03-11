"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";

const ACCENT = "#C8FF00";
const CYAN   = "#00E5FF";
const YELLOW = "#FFB800";
const PURPLE = "#A855F7";
const RED    = "#FF4444";
const GREEN  = "#22C55E";

// ── types ─────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  date: string;
  health_score: number;
  market_health: number;
  execution_health: number;
  finance_health: number;
  growth_health: number;
  competition_health: number;
  runway_months: number;
  idea: string;
}

interface Streak {
  current: number;
  longest: number;
  lastCheckin: string;
  totalCheckins: number;
}

interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

// ── achievement definitions ───────────────────────────────────────────────────

function computeAchievements(history: HistoryEntry[], streak: Streak): Achievement[] {
  const scores   = history.map(h => h.health_score);
  const maxScore = Math.max(...scores, 0);
  const latest   = history[history.length - 1];
  const first    = history[0];

  return [
    // onboarding
    {
      id: "first_analysis", icon: "⬡", title: "First Analysis",
      desc: "Run your first startup analysis",
      color: ACCENT, unlocked: history.length >= 1,
      unlockedAt: history[0]?.date,
    },
    // score milestones
    {
      id: "score_50", icon: "◎", title: "Halfway There",
      desc: "Reach a health score of 50",
      color: YELLOW, unlocked: maxScore >= 50,
      progress: Math.min(maxScore, 50), target: 50,
    },
    {
      id: "score_75", icon: "△", title: "Strong Signals",
      desc: "Reach a health score of 75",
      color: CYAN, unlocked: maxScore >= 75,
      progress: Math.min(maxScore, 75), target: 75,
    },
    {
      id: "score_90", icon: "★", title: "Investor Ready",
      desc: "Reach a health score of 90",
      color: PURPLE, unlocked: maxScore >= 90,
      progress: Math.min(maxScore, 90), target: 90,
    },
    // streak
    {
      id: "streak_3", icon: "🔥", title: "On Fire",
      desc: "Check in 3 weeks in a row",
      color: "#FF6B35", unlocked: streak.longest >= 3,
      progress: Math.min(streak.current, 3), target: 3,
    },
    {
      id: "streak_8", icon: "⚡", title: "Momentum",
      desc: "Check in 8 weeks in a row",
      color: YELLOW, unlocked: streak.longest >= 8,
      progress: Math.min(streak.current, 8), target: 8,
    },
    // improvement
    {
      id: "improved_10", icon: "↑", title: "Levelling Up",
      desc: "Improve your score by 10+ points",
      color: GREEN, unlocked: history.length >= 2 && (latest?.health_score - first?.health_score) >= 10,
      progress: latest && first ? Math.max(0, latest.health_score - first.health_score) : 0,
      target: 10,
    },
    {
      id: "improved_25", icon: "⬆", title: "Transformation",
      desc: "Improve your score by 25+ points",
      color: ACCENT, unlocked: history.length >= 2 && (latest?.health_score - first?.health_score) >= 25,
      progress: latest && first ? Math.max(0, latest.health_score - first.health_score) : 0,
      target: 25,
    },
    // consistency
    {
      id: "analyses_5", icon: "◈", title: "Committed Founder",
      desc: "Run 5 analyses",
      color: CYAN, unlocked: history.length >= 5,
      progress: Math.min(history.length, 5), target: 5,
    },
    {
      id: "analyses_12", icon: "⊕", title: "Data Driven",
      desc: "Run 12 analyses",
      color: PURPLE, unlocked: history.length >= 12,
      progress: Math.min(history.length, 12), target: 12,
    },
  ];
}

// ── sub-components ────────────────────────────────────────────────────────────

function ScoreChip({ value, prev }: { value: number; prev?: number }) {
  const delta = prev !== undefined ? value - prev : null;
  const color = value >= 75 ? ACCENT : value >= 50 ? YELLOW : RED;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color, lineHeight: 1 }}>{value}</span>
      {delta !== null && (
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: delta > 0 ? GREEN : delta < 0 ? RED : "rgba(255,255,255,0.3)", background: delta > 0 ? "rgba(34,197,94,0.1)" : delta < 0 ? "rgba(255,68,68,0.1)" : "transparent", border: `1px solid ${delta > 0 ? "rgba(34,197,94,0.2)" : delta < 0 ? "rgba(255,68,68,0.2)" : "transparent"}`, borderRadius: 4, padding: "2px 6px" }}>
          {delta > 0 ? "+" : ""}{delta}
        </span>
      )}
    </div>
  );
}

function AchievementCard({ a }: { a: Achievement }) {
  return (
    <div style={{
      background: a.unlocked ? `${a.color}08` : "rgba(255,255,255,0.02)",
      border: `1px solid ${a.unlocked ? a.color + "30" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 12, padding: "14px 16px",
      filter: a.unlocked ? "none" : "grayscale(1)",
      opacity: a.unlocked ? 1 : 0.5,
      transition: "all 0.3s",
      position: "relative", overflow: "hidden",
    }}>
      {a.unlocked && (
        <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: a.color, boxShadow: `0 0 6px ${a.color}` }} />
      )}
      <div style={{ fontSize: 22, marginBottom: 8 }}>{a.icon}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: a.unlocked ? "white" : "rgba(255,255,255,0.4)", marginBottom: 4 }}>{a.title}</div>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 1.4, marginBottom: a.target ? 10 : 0 }}>{a.desc}</div>
      {a.target && !a.unlocked && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.2)" }}>Progress</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: a.color }}>{a.progress}/{a.target}</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${Math.min(100, ((a.progress || 0) / a.target) * 100)}%`, background: a.color, borderRadius: 2 }} />
          </div>
        </div>
      )}
      {a.unlocked && a.unlockedAt && (
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: `${a.color}80`, marginTop: 4 }}>Unlocked {a.unlockedAt}</div>
      )}
    </div>
  );
}

function StreakFlame({ count }: { count: number }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <defs>
          <radialGradient id="flameGrad" cx="50%" cy="80%" r="60%">
            <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#flameGrad)" />
        <text x="50" y="58" textAnchor="middle" fontSize="40" fill="none">🔥</text>
        <text x="50" y="56" textAnchor="middle" fontSize="40">🔥</text>
      </svg>
      <div style={{ position: "absolute", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "white" }}>{count}</div>
    </div>
  );
}

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0D0D0D", border: "1px solid rgba(200,255,0,0.2)", padding: "10px 14px", borderRadius: 8, fontFamily: "'Space Mono',monospace", fontSize: 11 }}>
      <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || ACCENT }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ── main page ─────────────────────────────────────────────────────────────────

export default function RetentionPage() {
  const router = useRouter();
  const API    = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const [history,      setHistory]      = useState<HistoryEntry[]>([]);
  const [streak,       setStreak]       = useState<Streak>({ current: 0, longest: 0, lastCheckin: "", totalCheckins: 0 });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab,    setActiveTab]    = useState<"overview"|"history"|"achievements"|"digest">("overview");
  const [digest,       setDigest]       = useState<string>("");
  const [digestLoading,setDigestLoading]= useState(false);
  const [emailInput,   setEmailInput]   = useState("");
  const [emailSent,    setEmailSent]    = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [newUnlocks,   setNewUnlocks]   = useState<Achievement[]>([]);
  const [showUnlock,   setShowUnlock]   = useState(false);

  // ── load from localStorage on mount ────────────────────────────────────────
  useEffect(() => {
    const savedHistory = localStorage.getItem("cortiq_history");
    const savedStreak  = localStorage.getItem("cortiq_streak");
    const savedEmail   = localStorage.getItem("cortiq_email");

    const h: HistoryEntry[] = savedHistory ? JSON.parse(savedHistory) : [];
    const s: Streak = savedStreak ? JSON.parse(savedStreak) : { current: 0, longest: 0, lastCheckin: "", totalCheckins: 0 };

    // check if current result should be saved as today's check-in
    const currentResult = localStorage.getItem("cortiq_result");
    const currentForm   = localStorage.getItem("cortiq_form");

    if (currentResult && currentForm) {
      const r = JSON.parse(currentResult);
      const f = JSON.parse(currentForm);
      const result = r.result || r;

      const todayStr = today();
      const alreadyToday = h.length > 0 && h[h.length - 1].date === todayStr;

      if (!alreadyToday && result.health_score) {
        const entry: HistoryEntry = {
          date:               todayStr,
          health_score:       result.health_score       || 0,
          market_health:      result.market_health      || 0,
          execution_health:   result.execution_health   || 0,
          finance_health:     result.finance_health     || 0,
          growth_health:      result.growth_health      || 0,
          competition_health: result.competition_health || 0,
          runway_months:      result.runway_months      || 0,
          idea:               f.idea || "My Startup",
        };
        const newHistory = [...h, entry];
        localStorage.setItem("cortiq_history", JSON.stringify(newHistory));
        setHistory(newHistory);
        setCheckedInToday(true);

        // update streak
        const updatedStreak = updateStreak(s, todayStr);
        localStorage.setItem("cortiq_streak", JSON.stringify(updatedStreak));
        setStreak(updatedStreak);

        // compute achievements and check for new unlocks
        const oldAch = computeAchievements(h, s);
        const newAch = computeAchievements(newHistory, updatedStreak);
        const unlocked = newAch.filter((a, i) => a.unlocked && !oldAch[i]?.unlocked);
        if (unlocked.length > 0) {
          setNewUnlocks(unlocked);
          setShowUnlock(true);
          setTimeout(() => setShowUnlock(false), 5000);
        }
        setAchievements(newAch);
      } else {
        setHistory(h);
        setStreak(s);
        setAchievements(computeAchievements(h, s));
        if (alreadyToday) setCheckedInToday(true);
      }
    } else {
      setHistory(h);
      setStreak(s);
      setAchievements(computeAchievements(h, s));
    }

    if (savedEmail) setEmailInput(savedEmail);
  }, []);

  function updateStreak(s: Streak, todayStr: string): Streak {
    const last = s.lastCheckin;
    const gap  = last ? daysAgo(last) : 999;
    let current = s.current;

    if (gap === 0) return s; // already checked in today
    if (gap <= 7)  current = s.current + 1; // within a week = continue streak
    else           current = 1;             // gap too long = reset

    const longest = Math.max(s.longest, current);
    return { current, longest, lastCheckin: todayStr, totalCheckins: s.totalCheckins + 1 };
  }

  // ── weekly digest ───────────────────────────────────────────────────────────
  async function generateDigest() {
    setDigestLoading(true);
    try {
      const res = await fetch(`${API}/weekly-digest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, streak, achievements }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDigest(data.digest || "");
    } catch {
      setDigest("Could not generate digest — check backend.");
    }
    setDigestLoading(false);
  }

  function saveEmail() {
    localStorage.setItem("cortiq_email", emailInput);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  }

  // ── derived ─────────────────────────────────────────────────────────────────
  const latest      = history[history.length - 1];
  const prev        = history[history.length - 2];
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const chartData = history.map((h, i) => ({
    date:  h.date.slice(5), // MM-DD
    score: h.health_score,
    market: h.market_health,
    execution: h.execution_health,
    finance: h.finance_health,
  }));

  const TABS = [
    { id: "overview",      label: "Overview",      icon: "⬡" },
    { id: "history",       label: "Score History",  icon: "△" },
    { id: "achievements",  label: "Achievements",   icon: "★" },
    { id: "digest",        label: "Weekly Digest",  icon: "◎" },
  ] as const;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#050505; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1f1f1f; border-radius:2px; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes slideIn  { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 20px ${ACCENT}40} 50%{box-shadow:0 0 40px ${ACCENT}80} }
        .fade-up { animation:fadeUp 0.4s ease both; }
        .tag { display:inline-block; padding:3px 10px; background:rgba(200,255,0,0.10); border:1px solid rgba(200,255,0,0.25); border-radius:4px; font-family:'Space Mono',monospace; font-size:9px; color:${ACCENT}; letter-spacing:0.15em; text-transform:uppercase; }
        .panel { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:24px; }
        .tab-btn { padding:9px 18px; border-radius:8px; border:none; cursor:pointer; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.1em; transition:all 0.2s; background:transparent; }
      `}</style>

      <main style={{ minHeight:"100vh", background:"#050505", color:"white", padding:"40px 24px", position:"relative" }}>
        <div style={{ position:"fixed", inset:0, backgroundImage:`linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize:"60px 60px", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", top:0, left:0, right:0, height:"2px", background:"linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation:"scanline 8s linear infinite", pointerEvents:"none", zIndex:0 }} />

        {/* achievement unlock toast */}
        {showUnlock && newUnlocks.map((a, i) => (
          <div key={a.id} style={{ position:"fixed", top:80+i*70, right:24, zIndex:1000, background:"#0D0D0D", border:`1px solid ${a.color}40`, borderRadius:12, padding:"12px 18px", display:"flex", alignItems:"center", gap:12, animation:"slideIn 0.4s ease", boxShadow:`0 0 24px ${a.color}30` }}>
            <span style={{ fontSize:20 }}>{a.icon}</span>
            <div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:a.color, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:2 }}>Achievement Unlocked!</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:"white" }}>{a.title}</div>
            </div>
          </div>
        ))}

        <div style={{ maxWidth:960, margin:"0 auto", position:"relative", zIndex:1 }}>

          {/* header */}
          <div className="fade-up" style={{ marginBottom:32 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:ACCENT, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:16 }}>⬡</span>
              </div>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.3em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>CORTIQ · PROGRESS TRACKER</span>
              {checkedInToday && (
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:GREEN, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:4, padding:"2px 8px", letterSpacing:"0.1em" }}>✓ CHECKED IN TODAY</span>
              )}
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:800, lineHeight:1.05, letterSpacing:"-0.02em" }}>
              Startup<br /><span style={{ color:ACCENT }}>Progress Hub</span>
            </h1>
          </div>

          {/* quick stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }} className="fade-up">
            {[
              { label:"Current Score",  value: latest ? <ScoreChip value={latest.health_score} prev={prev?.health_score} /> : <span style={{color:"rgba(255,255,255,0.2)",fontSize:14,fontFamily:"'Space Mono',monospace"}}>No data</span>, color:ACCENT },
              { label:"Weekly Streak",  value: <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:28,color:"#FF6B35"}}>{streak.current}</span><span style={{fontSize:18}}>🔥</span></div>, color:"#FF6B35" },
              { label:"Achievements",   value: <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:28,color:PURPLE}}>{unlockedCount}<span style={{fontSize:14,color:"rgba(255,255,255,0.25)"}}>/{achievements.length}</span></span>, color:PURPLE },
              { label:"Total Check-ins",value: <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:28,color:CYAN}}>{streak.totalCheckins}</span>, color:CYAN },
            ].map(s => (
              <div key={s.label} className="panel" style={{ borderColor:`${s.color}18` }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:"0.15em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:10 }}>{s.label}</div>
                {s.value}
              </div>
            ))}
          </div>

          {/* tab bar */}
          <div style={{ display:"flex", gap:4, marginBottom:20, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:4 }}>
            {TABS.map(t => (
              <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)}
                style={{ flex:1, color: activeTab===t.id ? "#050505" : "rgba(255,255,255,0.4)", background: activeTab===t.id ? ACCENT : "transparent", fontWeight: activeTab===t.id ? 700 : 400 }}>
                <span style={{ marginRight:6 }}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }} className="fade-up">

              {/* streak card */}
              <div className="panel" style={{ borderColor:"rgba(255,107,53,0.2)", background:"rgba(255,107,53,0.03)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.2em", color:"rgba(255,107,53,0.7)", textTransform:"uppercase", marginBottom:10 }}>Weekly Check-in Streak</div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:8 }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:56, color:"#FF6B35", lineHeight:1 }}>{streak.current}</span>
                      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.4)" }}>weeks</span>
                    </div>
                    <div style={{ display:"flex", gap:16 }}>
                      <div>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.25)" }}>LONGEST</div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:"white" }}>{streak.longest}w</div>
                      </div>
                      <div>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.25)" }}>TOTAL</div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:"white" }}>{streak.totalCheckins}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.25)" }}>LAST CHECK-IN</div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:"white" }}>{streak.lastCheckin || "—"}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:72, lineHeight:1 }}>🔥</div>
                </div>

                {/* streak calendar — last 8 weeks */}
                <div style={{ marginTop:20 }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.25)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Last 8 Weeks</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {Array.from({length:8}, (_, i) => {
                      const weekDate = new Date();
                      weekDate.setDate(weekDate.getDate() - (7 - i) * 7);
                      const weekStr  = weekDate.toISOString().split("T")[0].slice(0, 7);
                      const hasData  = history.some(h => h.date.slice(0, 7) === weekStr);
                      return (
                        <div key={i} title={weekStr} style={{ flex:1, height:32, borderRadius:6, background: hasData ? "#FF6B35" : "rgba(255,255,255,0.05)", border:`1px solid ${hasData ? "#FF6B3560" : "rgba(255,255,255,0.06)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>
                          {hasData ? "✓" : ""}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)" }}>8 weeks ago</span>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)" }}>this week</span>
                  </div>
                </div>

                {!checkedInToday && (
                  <button onClick={() => router.push("/")} style={{ marginTop:16, width:"100%", padding:"12px", background:"#FF6B35", color:"white", fontFamily:"'Space Mono',monospace", fontSize:11, fontWeight:700, letterSpacing:"0.1em", border:"none", borderRadius:8, cursor:"pointer" }}>
                    Run This Week's Analysis →
                  </button>
                )}
              </div>

              {/* score trajectory mini chart */}
              {history.length >= 2 && (
                <div className="panel">
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.15em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:16 }}>Score Trajectory</div>
                  <div style={{ height:160 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" tick={{fontFamily:"'Space Mono',monospace",fontSize:8,fill:"rgba(255,255,255,0.25)"}} />
                        <YAxis domain={[0,100]} stroke="rgba(255,255,255,0.1)" tick={{fontFamily:"'Space Mono',monospace",fontSize:8,fill:"rgba(255,255,255,0.25)"}} width={30} />
                        <Tooltip content={<ChartTip />} />
                        <ReferenceLine y={75} stroke={ACCENT} strokeDasharray="4 4" strokeOpacity={0.3} />
                        <Line type="monotone" dataKey="score" name="Health" stroke={ACCENT} strokeWidth={2.5} dot={{ fill:ACCENT, r:4 }} activeDot={{ r:6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* recent achievements preview */}
              <div className="panel">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.15em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>Recent Achievements</span>
                  <button onClick={() => setActiveTab("achievements")} style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:ACCENT, background:"none", border:"none", cursor:"pointer" }}>View All →</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
                  {achievements.slice(0,5).map(a => <AchievementCard key={a.id} a={a} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ────────────────────────────────────────────────── */}
          {activeTab === "history" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }} className="fade-up">
              {history.length < 2 ? (
                <div className="panel" style={{ textAlign:"center", padding:"60px 40px" }}>
                  <div style={{ fontSize:32, color:"rgba(255,255,255,0.08)", marginBottom:12 }}>△</div>
                  <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:16 }}>Run at least 2 analyses to see your score history</p>
                  <button onClick={() => router.push("/")} style={{ padding:"10px 20px", background:"rgba(200,255,0,0.08)", border:"1px solid rgba(200,255,0,0.2)", color:ACCENT, fontFamily:"'Space Mono',monospace", fontSize:11, borderRadius:8, cursor:"pointer" }}>
                    Run Analysis →
                  </button>
                </div>
              ) : (
                <>
                  {/* full score chart */}
                  <div className="panel">
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.15em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:16 }}>Health Score Over Time</div>
                    <div style={{ height:240 }}>
                      <ResponsiveContainer>
                        <LineChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" tick={{fontFamily:"'Space Mono',monospace",fontSize:8,fill:"rgba(255,255,255,0.25)"}} />
                          <YAxis domain={[0,100]} stroke="rgba(255,255,255,0.1)" tick={{fontFamily:"'Space Mono',monospace",fontSize:8,fill:"rgba(255,255,255,0.25)"}} width={30} />
                          <Tooltip content={<ChartTip />} />
                          <ReferenceLine y={75} stroke={ACCENT} strokeDasharray="4 4" strokeOpacity={0.3} label={{ value:"Target", fill:"rgba(200,255,0,0.4)", fontSize:8, fontFamily:"Space Mono" }} />
                          <Line type="monotone" dataKey="score"     name="Overall"   stroke={ACCENT}  strokeWidth={2.5} dot={{fill:ACCENT,r:4}}  />
                          <Line type="monotone" dataKey="market"    name="Market"    stroke={CYAN}    strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                          <Line type="monotone" dataKey="execution" name="Execution" stroke={YELLOW}  strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                          <Line type="monotone" dataKey="finance"   name="Finance"   stroke={PURPLE}  strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap" }}>
                      {[["Overall",ACCENT],["Market",CYAN],["Execution",YELLOW],["Finance",PURPLE]].map(([l,c]) => (
                        <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <div style={{ width:16, height:2, background:c as string, borderRadius:1 }} />
                          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.35)" }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* history table */}
                  <div className="panel">
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.15em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:16 }}>All Entries</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                      {[...history].reverse().map((h, i) => {
                        const prev = history[history.length - 2 - i];
                        const delta = prev ? h.health_score - prev.health_score : null;
                        return (
                          <div key={h.date} style={{ display:"grid", gridTemplateColumns:"110px 1fr repeat(4,60px) 60px", gap:12, padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", alignItems:"center" }}>
                            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.4)" }}>{h.date}</span>
                            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.6)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.idea}</span>
                            {[h.market_health, h.execution_health, h.finance_health, h.competition_health].map((v, j) => (
                              <span key={j} style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.35)", textAlign:"center" }}>{v}</span>
                            ))}
                            <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end" }}>
                              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color: h.health_score >= 75 ? ACCENT : h.health_score >= 50 ? YELLOW : RED }}>{h.health_score}</span>
                              {delta !== null && <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color: delta > 0 ? GREEN : delta < 0 ? RED : "rgba(255,255,255,0.2)" }}>{delta > 0 ? "+" : ""}{delta}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"110px 1fr repeat(4,60px) 60px", gap:12, paddingTop:8 }}>
                      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)", textTransform:"uppercase" }}>Date</span>
                      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)", textTransform:"uppercase" }}>Startup</span>
                      {["Mkt","Exe","Fin","Comp"].map(l => <span key={l} style={{ fontFamily:"'Space Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)", textTransform:"uppercase", textAlign:"center" }}>{l}</span>)}
                      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)", textTransform:"uppercase", textAlign:"right" }}>Score</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ACHIEVEMENTS TAB ───────────────────────────────────────────── */}
          {activeTab === "achievements" && (
            <div className="fade-up">
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <span className="tag">{unlockedCount} / {achievements.length} Unlocked</span>
                <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                  <div style={{ height:"100%", width:`${(unlockedCount/achievements.length)*100}%`, background:PURPLE, borderRadius:2, transition:"width 1s ease", boxShadow:`0 0 8px ${PURPLE}60` }} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
                {achievements.map(a => <AchievementCard key={a.id} a={a} />)}
              </div>
            </div>
          )}

          {/* ── DIGEST TAB ─────────────────────────────────────────────────── */}
          {activeTab === "digest" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }} className="fade-up">

              {/* generate */}
              <div className="panel">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                  <div>
                    <span className="tag">AI Weekly Digest</span>
                    <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:8 }}>
                      A personalised summary of your progress, what changed, and what to focus on this week
                    </p>
                  </div>
                  <button onClick={generateDigest} disabled={digestLoading} style={{ padding:"10px 20px", background:ACCENT, color:"#050505", fontFamily:"'Space Mono',monospace", fontSize:11, fontWeight:700, letterSpacing:"0.1em", border:"none", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:8, opacity: digestLoading ? 0.7 : 1 }}>
                    {digestLoading ? <><div style={{ width:12, height:12, border:"2px solid rgba(0,0,0,0.3)", borderTopColor:"#050505", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> Generating…</> : "◎ Generate Digest"}
                  </button>
                </div>

                {digest && (
                  <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"20px 24px" }}>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, lineHeight:1.9, color:"rgba(255,255,255,0.7)", whiteSpace:"pre-line" }}>
                      {digest}
                    </div>
                  </div>
                )}
              </div>

              {/* email signup */}
              <div className="panel" style={{ borderColor:"rgba(0,229,255,0.15)", background:"rgba(0,229,255,0.02)" }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.2em", color:CYAN, textTransform:"uppercase", marginBottom:12 }}>📧 Weekly Email Digest</div>
                <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.5)", lineHeight:1.7, marginBottom:16 }}>
                  Get your startup health digest delivered to your inbox every Monday morning. Never miss a week.
                </p>
                <div style={{ display:"flex", gap:10 }}>
                  <input
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveEmail()}
                    placeholder="founder@startup.com"
                    type="email"
                    style={{ flex:1, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 14px", color:"white", fontFamily:"'Space Mono',monospace", fontSize:12, outline:"none" }}
                    onFocus={e => e.target.style.borderColor = CYAN+"60"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  <button onClick={saveEmail} style={{ padding:"10px 20px", background: emailSent ? "#1a2a1a" : CYAN, color: emailSent ? GREEN : "#050505", fontFamily:"'Space Mono',monospace", fontSize:11, fontWeight:700, letterSpacing:"0.1em", border:`1px solid ${emailSent ? GREEN : "transparent"}`, borderRadius:8, cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap" }}>
                    {emailSent ? "✓ Saved!" : "Subscribe →"}
                  </button>
                </div>
                <p style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:10 }}>
                  Email stored locally. Connect your email backend to actually send digests.
                </p>
              </div>

              {/* digest schedule info */}
              <div className="panel">
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.15em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:16 }}>What's in the digest</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {[
                    { icon:"△", title:"Score delta",     desc:"How your health score moved this week vs last" },
                    { icon:"◎", title:"Key insight",      desc:"The #1 thing the AI noticed about your startup" },
                    { icon:"⬡", title:"Action items",     desc:"3 specific things to do before next check-in" },
                    { icon:"★", title:"Streak update",    desc:"Your check-in streak and achievements progress" },
                  ].map(item => (
                    <div key={item.title} style={{ display:"flex", gap:12 }}>
                      <span style={{ color:ACCENT, fontSize:14, marginTop:2 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:"white", marginBottom:3 }}>{item.title}</div>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.35)", lineHeight:1.5 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* cta — if no history yet */}
          {history.length === 0 && (
            <div style={{ marginTop:24, padding:"32px", background:"rgba(200,255,0,0.03)", border:"1px solid rgba(200,255,0,0.12)", borderRadius:16, textAlign:"center" }}>
              <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:16 }}>
                Run your first analysis to start tracking progress
              </p>
              <button onClick={() => router.push("/")} style={{ padding:"13px 28px", background:ACCENT, color:"#050505", fontFamily:"'Space Mono',monospace", fontSize:11, fontWeight:700, letterSpacing:"0.12em", border:"none", borderRadius:10, cursor:"pointer" }}>
                ⬡ Start First Analysis
              </button>
            </div>
          )}

          <div style={{ marginTop:56, paddingTop:24, borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.15em" }}>CORTIQ © 2025</span>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.2)" }}>STAY CONSISTENT · BUILD THE HABIT</span>
          </div>
        </div>
      </main>
    </>
  );
}