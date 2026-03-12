"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

const ACCENT = "#C8FF00"; const CYAN = "#00E5FF"; const YELLOW = "#FFB800"; const PURPLE = "#A855F7"; const RED = "#FF4444"; const GREEN = "#22C55E";

interface HistoryEntry { date: string; health_score: number; market_health: number; execution_health: number; finance_health: number; growth_health: number; competition_health: number; runway_months: number; idea: string; }
interface Streak { current: number; longest: number; lastCheckin: string; totalCheckins: number; }
interface Achievement { id: string; icon: string; title: string; desc: string; color: string; unlocked: boolean; unlockedAt?: string; progress?: number; target?: number; }

function today() { return new Date().toISOString().split("T")[0]; }
function daysAgo(dateStr: string) { return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000); }

function computeAchievements(history: HistoryEntry[], streak: Streak): Achievement[] {
  const scores = history.map(h => h.health_score); const maxScore = Math.max(...scores, 0);
  const latest = history[history.length - 1]; const first = history[0];
  return [
    { id: "first_analysis", icon: "⬡", title: "First Analysis", desc: "Run your first startup analysis", color: ACCENT, unlocked: history.length >= 1, unlockedAt: history[0]?.date },
    { id: "score_50", icon: "◎", title: "Halfway There", desc: "Reach a health score of 50", color: YELLOW, unlocked: maxScore >= 50, progress: Math.min(maxScore, 50), target: 50 },
    { id: "score_75", icon: "△", title: "Strong Signals", desc: "Reach a health score of 75", color: CYAN, unlocked: maxScore >= 75, progress: Math.min(maxScore, 75), target: 75 },
    { id: "score_90", icon: "★", title: "Investor Ready", desc: "Reach a health score of 90", color: PURPLE, unlocked: maxScore >= 90, progress: Math.min(maxScore, 90), target: 90 },
    { id: "streak_3", icon: "🔥", title: "On Fire", desc: "Check in 3 weeks in a row", color: "#FF6B35", unlocked: streak.longest >= 3, progress: Math.min(streak.current, 3), target: 3 },
    { id: "streak_8", icon: "⚡", title: "Momentum", desc: "Check in 8 weeks in a row", color: YELLOW, unlocked: streak.longest >= 8, progress: Math.min(streak.current, 8), target: 8 },
    { id: "improved_10", icon: "↑", title: "Levelling Up", desc: "Improve your score by 10+ points", color: GREEN, unlocked: history.length >= 2 && (latest?.health_score - first?.health_score) >= 10, progress: latest && first ? Math.max(0, latest.health_score - first.health_score) : 0, target: 10 },
    { id: "improved_25", icon: "⬆", title: "Transformation", desc: "Improve your score by 25+ points", color: ACCENT, unlocked: history.length >= 2 && (latest?.health_score - first?.health_score) >= 25, progress: latest && first ? Math.max(0, latest.health_score - first.health_score) : 0, target: 25 },
    { id: "analyses_5", icon: "◈", title: "Committed Founder", desc: "Run 5 analyses", color: CYAN, unlocked: history.length >= 5, progress: Math.min(history.length, 5), target: 5 },
    { id: "analyses_12", icon: "⊕", title: "Data Driven", desc: "Run 12 analyses", color: PURPLE, unlocked: history.length >= 12, progress: Math.min(history.length, 12), target: 12 },
  ];
}

function ScoreChip({ value, prev }: { value: number; prev?: number }) {
  const delta = prev !== undefined ? value - prev : null;
  const color = value >= 75 ? ACCENT : value >= 50 ? YELLOW : RED;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{value}</span>
      {delta !== null && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: delta > 0 ? GREEN : delta < 0 ? RED : "rgba(255,255,255,0.3)", background: delta > 0 ? "rgba(34,197,94,0.1)" : delta < 0 ? "rgba(255,68,68,0.1)" : "transparent", border: `1px solid ${delta > 0 ? "rgba(34,197,94,0.2)" : "rgba(255,68,68,0.2)"}`, borderRadius: 4, padding: "2px 6px" }}>{delta > 0 ? "+" : ""}{delta}</span>}
    </div>
  );
}

function AchievementCard({ a, compact }: { a: Achievement; compact?: boolean }) {
  return (
    <div style={{ background: a.unlocked ? `${a.color}08` : "rgba(255,255,255,0.02)", border: `1px solid ${a.unlocked ? a.color + "30" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, padding: compact ? "12px" : "14px 16px", filter: a.unlocked ? "none" : "grayscale(1)", opacity: a.unlocked ? 1 : 0.5, position: "relative", overflow: "hidden" }}>
      {a.unlocked && <div style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: a.color, boxShadow: `0 0 6px ${a.color}` }} />}
      <div style={{ fontSize: compact ? 18 : 22, marginBottom: 6 }}>{a.icon}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: compact ? 11 : 13, color: a.unlocked ? "white" : "rgba(255,255,255,0.4)", marginBottom: 3 }}>{a.title}</div>
      {!compact && <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 1.4, marginBottom: a.target ? 8 : 0 }}>{a.desc}</div>}
      {a.target && !a.unlocked && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 7, color: "rgba(255,255,255,0.2)" }}>Progress</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 7, color: a.color }}>{a.progress}/{a.target}</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${Math.min(100, ((a.progress || 0) / a.target) * 100)}%`, background: a.color, borderRadius: 2 }} />
          </div>
        </div>
      )}
    </div>
  );
}

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0D0D0D", border: "1px solid rgba(200,255,0,0.2)", padding: "10px 14px", borderRadius: 8, fontFamily: "'Space Mono',monospace", fontSize: 11 }}>
      <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => <p key={p.dataKey} style={{ color: p.color || ACCENT }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function RetentionPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [streak, setStreak] = useState<Streak>({ current: 0, longest: 0, lastCheckin: "", totalCheckins: 0 });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "achievements" | "digest">("overview");
  const [digest, setDigest] = useState(""); const [digestLoading, setDigestLoading] = useState(false);
  const [emailInput, setEmailInput] = useState(""); const [emailSent, setEmailSent] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([]); const [showUnlock, setShowUnlock] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem("cortiq_history");
    const savedStreak = localStorage.getItem("cortiq_streak");
    const savedEmail = localStorage.getItem("cortiq_email");
    const h: HistoryEntry[] = savedHistory ? JSON.parse(savedHistory) : [];
    const s: Streak = savedStreak ? JSON.parse(savedStreak) : { current: 0, longest: 0, lastCheckin: "", totalCheckins: 0 };
    const currentResult = localStorage.getItem("cortiq_result"); const currentForm = localStorage.getItem("cortiq_form");
    if (currentResult && currentForm) {
      const r = JSON.parse(currentResult); const f = JSON.parse(currentForm); const result = r.result || r;
      const todayStr = today(); const alreadyToday = h.length > 0 && h[h.length - 1].date === todayStr;
      if (!alreadyToday && result.health_score) {
        const entry: HistoryEntry = { date: todayStr, health_score: result.health_score || 0, market_health: result.market_health || 0, execution_health: result.execution_health || 0, finance_health: result.finance_health || 0, growth_health: result.growth_health || 0, competition_health: result.competition_health || 0, runway_months: result.runway_months || 0, idea: f.idea || "My Startup" };
        const newHistory = [...h, entry]; localStorage.setItem("cortiq_history", JSON.stringify(newHistory)); setHistory(newHistory); setCheckedInToday(true);
        const updatedStreak = updateStreak(s, todayStr); localStorage.setItem("cortiq_streak", JSON.stringify(updatedStreak)); setStreak(updatedStreak);
        const oldAch = computeAchievements(h, s); const newAch = computeAchievements(newHistory, updatedStreak);
        const unlocked = newAch.filter((a, i) => a.unlocked && !oldAch[i]?.unlocked);
        if (unlocked.length > 0) { setNewUnlocks(unlocked); setShowUnlock(true); setTimeout(() => setShowUnlock(false), 5000); }
        setAchievements(newAch);
      } else { setHistory(h); setStreak(s); setAchievements(computeAchievements(h, s)); if (alreadyToday) setCheckedInToday(true); }
    } else { setHistory(h); setStreak(s); setAchievements(computeAchievements(h, s)); }
    if (savedEmail) setEmailInput(savedEmail);
  }, []);

  function updateStreak(s: Streak, todayStr: string): Streak {
    const gap = s.lastCheckin ? daysAgo(s.lastCheckin) : 999;
    if (gap === 0) return s;
    const current = gap <= 7 ? s.current + 1 : 1;
    return { current, longest: Math.max(s.longest, current), lastCheckin: todayStr, totalCheckins: s.totalCheckins + 1 };
  }

  async function generateDigest() {
    setDigestLoading(true);
    try {
      const res = await fetch(`${API}/weekly-digest`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ history, streak, achievements }) });
      if (!res.ok) throw new Error("Failed"); const data = await res.json(); setDigest(data.digest || "");
    } catch { setDigest("Could not generate digest — check backend."); }
    setDigestLoading(false);
  }

  function saveEmail() { localStorage.setItem("cortiq_email", emailInput); setEmailSent(true); setTimeout(() => setEmailSent(false), 3000); }

  const latest = history[history.length - 1]; const prev = history[history.length - 2];
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const chartData = history.map(h => ({ date: h.date.slice(5), score: h.health_score, market: h.market_health, execution: h.execution_health, finance: h.finance_health }));
  const TABS = [{ id: "overview", label: "Overview", icon: "⬡" }, { id: "history", label: "History", icon: "△" }, { id: "achievements", label: "Badges", icon: "★" }, { id: "digest", label: "Digest", icon: "◎" }] as const;

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
        @keyframes slideIn { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .tag { display:inline-block; padding:3px 10px; background:rgba(200,255,0,0.10); border:1px solid rgba(200,255,0,0.25); border-radius:4px; font-family:'Space Mono',monospace; font-size:9px; color:${ACCENT}; letter-spacing:0.15em; text-transform:uppercase; }
        .panel { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:24px; }
        .tab-btn { border-radius:8px; border:none; cursor:pointer; font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.08em; transition:all 0.2s; background:transparent; min-height:44px; flex:1; -webkit-tap-highlight-color:transparent; }
        .action-btn { padding:13px 20px; font-family:'Space Mono',monospace; font-size:11px; font-weight:700; letter-spacing:0.1em; border-radius:10px; cursor:pointer; transition:all 0.2s; min-height:52px; border:none; -webkit-tap-highlight-color:transparent; }
        @media (max-width:768px) { .panel { padding: 16px; } }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: isMobile ? "20px 16px" : "40px 24px", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 0 }} />

        {showUnlock && newUnlocks.map((a, i) => (
          <div key={a.id} style={{ position: "fixed", top: 80 + i * 70, right: isMobile ? 12 : 24, zIndex: 1000, background: "#0D0D0D", border: `1px solid ${a.color}40`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, animation: "slideIn 0.4s ease", boxShadow: `0 0 24px ${a.color}30`, maxWidth: 280 }}>
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            <div><div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: a.color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>Achievement Unlocked!</div><div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: "white" }}>{a.title}</div></div>
          </div>
        ))}

        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="fade-up" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 16 }}>⬡</span></div>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>CORTIQ · PROGRESS</span>
              {checkedInToday && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: GREEN, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 4, padding: "2px 8px" }}>✓ TODAY</span>}
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,5vw,44px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              Startup<br /><span style={{ color: ACCENT }}>Progress Hub</span>
            </h1>
          </div>

          {/* stats */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 20 }} className="fade-up">
            {[
              { label: "Current Score", value: latest ? <ScoreChip value={latest.health_score} prev={prev?.health_score} /> : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, fontFamily: "'Space Mono',monospace" }}>No data</span>, color: ACCENT },
              { label: "Streak", value: <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#FF6B35" }}>{streak.current}</span><span style={{ fontSize: 18 }}>🔥</span></div>, color: "#FF6B35" },
              { label: "Badges", value: <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: PURPLE }}>{unlockedCount}<span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>/{achievements.length}</span></span>, color: PURPLE },
              { label: "Check-ins", value: <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: CYAN }}>{streak.totalCheckins}</span>, color: CYAN },
            ].map(s => (
              <div key={s.label} className="panel" style={{ borderColor: `${s.color}18` }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>{s.label}</div>
                {s.value}
              </div>
            ))}
          </div>

          {/* tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 4 }}>
            {TABS.map(t => (
              <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)}
                style={{ color: activeTab === t.id ? "#050505" : "rgba(255,255,255,0.4)", background: activeTab === t.id ? ACCENT : "transparent", fontWeight: activeTab === t.id ? 700 : 400, padding: isMobile ? "8px 4px" : "9px 12px" }}>
                <span style={{ marginRight: isMobile ? 0 : 4 }}>{t.icon}</span>{!isMobile && t.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="fade-up">
              <div className="panel" style={{ borderColor: "rgba(255,107,53,0.2)", background: "rgba(255,107,53,0.03)" }}>
                <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,107,53,0.7)", textTransform: "uppercase", marginBottom: 10 }}>Weekly Check-in Streak</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: isMobile ? 44 : 56, color: "#FF6B35", lineHeight: 1 }}>{streak.current}</span>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>weeks</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {[{ label: "LONGEST", val: `${streak.longest}w` }, { label: "TOTAL", val: streak.totalCheckins }, { label: "LAST", val: streak.lastCheckin || "—" }].map(s => (
                        <div key={s.label}>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.25)" }}>{s.label}</div>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "white" }}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {!isMobile && <div style={{ fontSize: 64, lineHeight: 1 }}>🔥</div>}
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Last 8 Weeks</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: 8 }, (_, i) => {
                      const weekDate = new Date(); weekDate.setDate(weekDate.getDate() - (7 - i) * 7);
                      const weekStr = weekDate.toISOString().split("T")[0].slice(0, 7);
                      const hasData = history.some(h => h.date.slice(0, 7) === weekStr);
                      return <div key={i} style={{ flex: 1, height: 28, borderRadius: 6, background: hasData ? "#FF6B35" : "rgba(255,255,255,0.05)", border: `1px solid ${hasData ? "#FF6B3560" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{hasData ? "✓" : ""}</div>;
                    })}
                  </div>
                </div>
                {!checkedInToday && (
                  <button className="action-btn" onClick={() => router.push("/")} style={{ marginTop: 14, width: "100%", background: "#FF6B35", color: "white" }}>
                    Run This Week's Analysis →
                  </button>
                )}
              </div>

              {history.length >= 2 && (
                <div className="panel">
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 14 }}>Score Trajectory</div>
                  <div style={{ height: isMobile ? 140 : 160 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" tick={{ fontFamily: "'Space Mono',monospace", fontSize: 8, fill: "rgba(255,255,255,0.25)" }} />
                        <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.1)" tick={{ fontFamily: "'Space Mono',monospace", fontSize: 8, fill: "rgba(255,255,255,0.25)" }} width={28} />
                        <Tooltip content={<ChartTip />} />
                        <ReferenceLine y={75} stroke={ACCENT} strokeDasharray="4 4" strokeOpacity={0.3} />
                        <Line type="monotone" dataKey="score" name="Health" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Recent Badges</span>
                  <button onClick={() => setActiveTab("achievements")} style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: ACCENT, background: "none", border: "none", cursor: "pointer" }}>View All →</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(5,1fr)", gap: 8 }}>
                  {achievements.slice(0, isMobile ? 6 : 5).map(a => <AchievementCard key={a.id} a={a} compact={isMobile} />)}
                </div>
              </div>
            </div>
          )}

          {/* HISTORY */}
          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="fade-up">
              {history.length < 2 ? (
                <div className="panel" style={{ textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ fontSize: 28, color: "rgba(255,255,255,0.08)", marginBottom: 12 }}>△</div>
                  <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 16 }}>Run at least 2 analyses to see score history</p>
                  <button className="action-btn" onClick={() => router.push("/")} style={{ background: ACCENT, color: "#050505" }}>Run Analysis →</button>
                </div>
              ) : (
                <>
                  <div className="panel">
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 14 }}>Health Score Over Time</div>
                    <div style={{ height: isMobile ? 180 : 240 }}>
                      <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" tick={{ fontFamily: "'Space Mono',monospace", fontSize: 8, fill: "rgba(255,255,255,0.25)" }} />
                          <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.1)" tick={{ fontFamily: "'Space Mono',monospace", fontSize: 8, fill: "rgba(255,255,255,0.25)" }} width={28} />
                          <Tooltip content={<ChartTip />} />
                          <ReferenceLine y={75} stroke={ACCENT} strokeDasharray="4 4" strokeOpacity={0.3} />
                          <Line type="monotone" dataKey="score" name="Overall" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 4 }} />
                          {!isMobile && <>
                            <Line type="monotone" dataKey="market" name="Market" stroke={CYAN} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey="execution" name="Execution" stroke={YELLOW} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey="finance" name="Finance" stroke={PURPLE} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                          </>}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="panel">
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 14 }}>All Entries</div>
                    <div style={{ overflowX: "auto" }}>
                      <div style={{ minWidth: isMobile ? 400 : "auto" }}>
                        {[...history].reverse().map((h, i) => {
                          const p = history[history.length - 2 - i];
                          const delta = p ? h.health_score - p.health_score : null;
                          return (
                            <div key={h.date} style={{ display: "grid", gridTemplateColumns: "90px 1fr 40px 40px 40px 40px 52px", gap: 8, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{h.date}</span>
                              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.idea}</span>
                              {[h.market_health, h.execution_health, h.finance_health, h.competition_health].map((v, j) => (
                                <span key={j} style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>{v}</span>
                              ))}
                              <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: h.health_score >= 75 ? ACCENT : h.health_score >= 50 ? YELLOW : RED }}>{h.health_score}</span>
                                {delta !== null && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 7, color: delta > 0 ? GREEN : delta < 0 ? RED : "rgba(255,255,255,0.2)" }}>{delta > 0 ? "+" : ""}{delta}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ACHIEVEMENTS */}
          {activeTab === "achievements" && (
            <div className="fade-up">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span className="tag">{unlockedCount} / {achievements.length}</span>
                <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${(unlockedCount / achievements.length) * 100}%`, background: PURPLE, borderRadius: 2, transition: "width 1s ease" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
                {achievements.map(a => <AchievementCard key={a.id} a={a} />)}
              </div>
            </div>
          )}

          {/* DIGEST */}
          {activeTab === "digest" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="fade-up">
              <div className="panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexDirection: isMobile ? "column" : "row", gap: 12 }}>
                  <div>
                    <span className="tag">AI Weekly Digest</span>
                    <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 8, lineHeight: 1.6 }}>A personalised summary of your progress, insights, and focus areas</p>
                  </div>
                  <button className="action-btn" onClick={generateDigest} disabled={digestLoading} style={{ background: ACCENT, color: "#050505", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", opacity: digestLoading ? 0.7 : 1, width: isMobile ? "100%" : "auto" }}>
                    {digestLoading ? <><div style={{ width: 12, height: 12, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#050505", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating…</> : "◎ Generate Digest"}
                  </button>
                </div>
                {digest && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "18px 20px" }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.9, color: "rgba(255,255,255,0.7)", whiteSpace: "pre-line" }}>{digest}</div>
                  </div>
                )}
              </div>

              <div className="panel" style={{ borderColor: "rgba(0,229,255,0.15)", background: "rgba(0,229,255,0.02)" }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: CYAN, textTransform: "uppercase", marginBottom: 12 }}>📧 Weekly Email</div>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 14 }}>Get your startup health digest every Monday morning.</p>
                <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
                  <input value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEmail()} placeholder="founder@startup.com" type="email"
                    style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 14px", color: "white", fontFamily: "'Space Mono',monospace", fontSize: 14, outline: "none", minHeight: 48 }} />
                  <button className="action-btn" onClick={saveEmail} style={{ background: emailSent ? "#1a2a1a" : CYAN, color: emailSent ? GREEN : "#050505", border: `1px solid ${emailSent ? GREEN : "transparent"}`, whiteSpace: "nowrap" }}>
                    {emailSent ? "✓ Saved!" : "Subscribe →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {history.length === 0 && (
            <div style={{ marginTop: 20, padding: "28px 20px", background: "rgba(200,255,0,0.03)", border: "1px solid rgba(200,255,0,0.12)", borderRadius: 14, textAlign: "center" }}>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>Run your first analysis to start tracking progress</p>
              <button className="action-btn" onClick={() => router.push("/")} style={{ background: ACCENT, color: "#050505" }}>⬡ Start First Analysis</button>
            </div>
          )}

          <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>CORTIQ © 2025</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>STAY CONSISTENT · BUILD THE HABIT</span>
          </div>
        </div>
      </main>
    </>
  );
}