"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#C8FF00";
const CYAN   = "#00E5FF";
const ORANGE = "#FF6B35";
const PURPLE = "#A855F7";
const RED    = "#FF4444";
const GREEN  = "#22C55E";

interface DailyTask {
  id: string; date: string;
  area: "market" | "execution" | "finance" | "growth" | "competition";
  title: string; why: string; steps: string[];
  done: boolean; doneAt?: string; skipped?: boolean; reflection?: string;
}
interface WeeklyReport {
  weekStart: string; tasksTotal: number; tasksDone: number;
  verdict: "improving" | "steady" | "slipping";
  summary: string; nudge: string; scoreChange?: number;
}
interface MentorData {
  tasks: DailyTask[]; weeklyReports: WeeklyReport[];
  streak: number; lastGenDate: string; totalDone: number;
}

function todayStr() { return new Date().toISOString().split("T")[0]; }
function weekStart() {
  const d = new Date(), day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}

const AREA_META: Record<string, { color: string; label: string }> = {
  market:      { color: CYAN,   label: "Market"      },
  execution:   { color: ACCENT, label: "Execution"   },
  finance:     { color: ORANGE, label: "Finance"     },
  growth:      { color: GREEN,  label: "Growth"      },
  competition: { color: PURPLE, label: "Competition" },
};

function TaskCard({ task, onDone, onSkip, onReflect, isMobile }: {
  task: DailyTask; onDone: () => void; onSkip: () => void;
  onReflect: (text: string) => void; isMobile: boolean;
}) {
  const meta = AREA_META[task.area];
  const [showSteps,   setShowSteps]   = useState(true);
  const [reflectMode, setReflectMode] = useState(false);
  const [reflectText, setReflectText] = useState(task.reflection || "");

  return (
    <div style={{ background: task.done ? `${GREEN}06` : task.skipped ? "rgba(255,255,255,0.01)" : `${meta.color}06`, border: `1px solid ${task.done ? GREEN+"30" : task.skipped ? "rgba(255,255,255,0.06)" : meta.color+"25"}`, borderRadius: 16, overflow: "hidden", opacity: task.skipped ? 0.5 : 1, transition: "all 0.3s" }}>
      <div style={{ height: 3, background: task.done ? GREEN : task.skipped ? "rgba(255,255,255,0.1)" : meta.color }} />
      <div style={{ padding: isMobile ? "16px" : "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, minWidth: 38, borderRadius: 10, background: `${meta.color}15`, border: `1px solid ${meta.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: meta.color, fontWeight: 700 }}>
            {task.done ? "OK" : task.area.slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: meta.color, background: `${meta.color}12`, border: `1px solid ${meta.color}25`, borderRadius: 3, padding: "2px 7px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{meta.label}</span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.25)" }}>{task.date}</span>
              {task.done && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: GREEN, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 3, padding: "2px 7px" }}>DONE</span>}
            </div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: isMobile ? 15 : 17, color: task.done ? "rgba(255,255,255,0.6)" : "white", lineHeight: 1.25, textDecoration: task.done ? "line-through" : "none", wordBreak: "break-word" }}>
              {task.title}
            </h3>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, borderLeft: `3px solid ${meta.color}60` }}>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
            <span style={{ color: meta.color, fontWeight: 700 }}>Why: </span>{task.why}
          </span>
        </div>

        {!task.done && !task.skipped && (
          <div>
            <button onClick={() => setShowSteps(!showSteps)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: showSteps ? 10 : 0, padding: 0 }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Steps {showSteps ? "(-)" : "(+)"}</span>
            </button>
            {showSteps && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {task.steps.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: 5, background: `${meta.color}12`, border: `1px solid ${meta.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 8, color: meta.color, flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {task.done && !reflectMode && !task.reflection && (
          <button onClick={() => setReflectMode(true)} style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", marginTop: 8 }}>
            + Add reflection
          </button>
        )}
        {task.reflection && !reflectMode && (
          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px", borderLeft: "3px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>"{task.reflection}"</span>
          </div>
        )}
        {reflectMode && (
          <div style={{ marginTop: 12 }}>
            <textarea value={reflectText} onChange={e => setReflectText(e.target.value)} placeholder="What did you learn? What worked?" rows={3}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 12px", color: "white", fontFamily: "'Space Mono',monospace", fontSize: 11, resize: "none", outline: "none", lineHeight: 1.6 }} />
            <button onClick={() => { onReflect(reflectText); setReflectMode(false); }}
              style={{ marginTop: 8, padding: "8px 16px", background: ACCENT, color: "#050505", fontFamily: "'Space Mono',monospace", fontSize: 10, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer", minHeight: 36 }}>
              Save
            </button>
          </div>
        )}

        {!task.done && !task.skipped && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={onDone} style={{ flex: 1, padding: "12px", background: meta.color, color: "#050505", fontFamily: "'Space Mono',monospace", fontSize: 11, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer", minHeight: 48 }}>
              Mark Done
            </button>
            <button onClick={onSkip} style={{ padding: "12px 18px", background: "transparent", color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono',monospace", fontSize: 10, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, cursor: "pointer", minHeight: 48 }}>
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function WeeklyReportCard({ report, isMobile }: { report: WeeklyReport; isMobile: boolean }) {
  const pct = report.tasksTotal > 0 ? Math.round((report.tasksDone / report.tasksTotal) * 100) : 0;
  const v = { improving: { color: GREEN, label: "IMPROVING" }, steady: { color: ORANGE, label: "STEADY" }, slipping: { color: RED, label: "SLIPPING" } }[report.verdict];
  return (
    <div style={{ background: `${v.color}06`, border: `1px solid ${v.color}25`, borderRadius: 14, padding: isMobile ? "16px" : "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>WEEK OF {report.weekStart}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: v.color, fontWeight: 700, letterSpacing: "0.12em" }}>{v.label}</span>
            {report.scoreChange !== undefined && (
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: report.scoreChange > 0 ? GREEN : RED, background: report.scoreChange > 0 ? "rgba(34,197,94,0.1)" : "rgba(255,68,68,0.1)", borderRadius: 4, padding: "2px 7px" }}>
                {report.scoreChange > 0 ? "+" : ""}{report.scoreChange} pts
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color: v.color, lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{report.tasksDone}/{report.tasksTotal} tasks</div>
        </div>
      </div>
      <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: v.color, borderRadius: 3, transition: "width 1s ease", boxShadow: `0 0 8px ${v.color}60` }} />
      </div>
      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, lineHeight: 1.75, color: "rgba(255,255,255,0.65)", marginBottom: 10 }}>{report.summary}</p>
      <div style={{ background: `${v.color}10`, border: `1px solid ${v.color}20`, borderRadius: 8, padding: "10px 14px" }}>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: v.color, lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700 }}>Mentor says: </span>{report.nudge}
        </span>
      </div>
    </div>
  );
}

export default function MentorPage() {
  const router = useRouter();
  const API    = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const [mentorData,   setMentorData]   = useState<MentorData | null>(null);
  const [genLoading,   setGenLoading]   = useState(false);
  const [weekLoading,  setWeekLoading]  = useState(false);
  const [error,        setError]        = useState("");
  const [activeTab,    setActiveTab]    = useState<"today"|"week"|"history">("today");
  const [isMobile,     setIsMobile]     = useState(false);
  const [tick,         setTick]         = useState(0);
  const [chatOpen,     setChatOpen]     = useState(false);
  const [chatMessages, setChatMessages] = useState<{role:"user"|"assistant";text:string}[]>([]);
  const [chatInput,    setChatInput]    = useState("");
  const [chatLoading,  setChatLoading]  = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    const id = setInterval(() => setTick(t => t + 1), 600);
    const saved = localStorage.getItem("cortiq_mentor");
    if (saved) setMentorData(JSON.parse(saved));
    return () => { window.removeEventListener("resize", check); clearInterval(id); };
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  function saveData(data: MentorData) {
    localStorage.setItem("cortiq_mentor", JSON.stringify(data));
    setMentorData(data);
  }

  async function generateTask() {
    setGenLoading(true); setError("");
    const result = JSON.parse(localStorage.getItem("cortiq_result") || "{}");
    const form   = JSON.parse(localStorage.getItem("cortiq_form")   || "{}");
    const r      = result.result || result;
    if (!r.health_score) {
      setError("Run a startup analysis first so your mentor knows your data.");
      setGenLoading(false); return;
    }
    try {
      const existing    = mentorData?.tasks || [];
      const recentAreas = existing.slice(-5).map((t: DailyTask) => t.area);
      const res = await fetch(`${API}/mentor/daily-task`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: form.idea || "", customer: form.customer || "",
          market_health: r.market_health || 50, execution_health: r.execution_health || 50,
          finance_health: r.finance_health || 50, growth_health: r.growth_health || 50,
          competition_health: r.competition_health || 50,
          biggest_problem: r.biggest_problem || "",
          recent_areas: recentAreas,
          tasks_done: existing.filter((t: DailyTask) => t.done).length,
          tasks_total: existing.length,
        }),
      });
      if (!res.ok) throw new Error("Backend error");
      const parsed = await res.json();
      const newTask: DailyTask = {
        id: `task_${Date.now()}`, date: todayStr(),
        area: parsed.area as DailyTask["area"],
        title: parsed.title, why: parsed.why, steps: parsed.steps || [], done: false,
      };
      saveData({
        tasks: [...existing, newTask],
        weeklyReports: mentorData?.weeklyReports || [],
        streak: mentorData?.streak || 0,
        lastGenDate: todayStr(),
        totalDone: mentorData?.totalDone || 0,
      });
    } catch { setError("Could not generate task — check backend is running."); }
    setGenLoading(false);
  }

  function markDone(id: string) {
    if (!mentorData) return;
    saveData({ ...mentorData, tasks: mentorData.tasks.map(t => t.id === id ? { ...t, done: true, doneAt: new Date().toISOString() } : t), totalDone: mentorData.totalDone + 1, streak: mentorData.streak + 1 });
  }
  function markSkip(id: string) {
    if (!mentorData) return;
    saveData({ ...mentorData, tasks: mentorData.tasks.map(t => t.id === id ? { ...t, skipped: true } : t) });
  }
  function addReflection(id: string, text: string) {
    if (!mentorData) return;
    saveData({ ...mentorData, tasks: mentorData.tasks.map(t => t.id === id ? { ...t, reflection: text } : t) });
  }

  async function generateWeeklyReport() {
    if (!mentorData) return;
    setWeekLoading(true); setError("");
    const ws    = weekStart();
    const tasks = mentorData.tasks.filter(t => t.date >= ws);
    const done  = tasks.filter(t => t.done);
    const hist  = JSON.parse(localStorage.getItem("cortiq_history") || "[]");
    const scoreChange = hist.length >= 2 ? hist[hist.length-1]?.health_score - hist[hist.length-2]?.health_score : undefined;
    try {
      const res = await fetch(`${API}/mentor/weekly-report`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks_done: done.length, tasks_total: tasks.length,
          done_titles: done.map((t: DailyTask) => t.title),
          skipped_titles: tasks.filter((t: DailyTask) => t.skipped).map((t: DailyTask) => t.title),
          reflections: done.map((t: DailyTask) => t.reflection).filter(Boolean) as string[],
          score_change: scoreChange,
        }),
      });
      if (!res.ok) throw new Error("Backend error");
      const parsed = await res.json();
      saveData({ ...mentorData, weeklyReports: [...mentorData.weeklyReports, { weekStart: ws, tasksTotal: tasks.length, tasksDone: done.length, verdict: parsed.verdict, summary: parsed.summary, nudge: parsed.nudge, scoreChange }] });
    } catch { setError("Could not generate weekly report — check backend."); }
    setWeekLoading(false);
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const updatedMessages = [...chatMessages, { role: "user" as const, text: userMsg }];
    setChatMessages(updatedMessages);
    setChatLoading(true);
    const result = JSON.parse(localStorage.getItem("cortiq_result") || "{}");
    const form   = JSON.parse(localStorage.getItem("cortiq_form") || "{}");
    const r      = result.result || result;
    try {
      const res = await fetch(`${API}/mentor/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: form.idea || "",
          health_score: r.health_score || 0,
          biggest_problem: r.biggest_problem || "",
          recent_tasks: mentorData?.tasks.slice(-5).map(t => `${t.title} (${t.done ? "done" : t.skipped ? "skipped" : "pending"})`) || [],
          messages: updatedMessages.map(m => ({ role: m.role, content: m.text })),
        }),
      });
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", text: data.reply || "No response from mentor." }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Connection error — check backend." }]);
    }
    setChatLoading(false);
  }

  const today          = todayStr();
  const todayTask      = mentorData?.tasks.find(t => t.date === today);
  const thisWeekTasks  = mentorData?.tasks.filter(t => t.date >= weekStart()) || [];
  const thisWeekDone   = thisWeekTasks.filter(t => t.done).length;
  const completionPct  = thisWeekTasks.length > 0 ? Math.round((thisWeekDone / thisWeekTasks.length) * 100) : 0;
  const latestReport   = mentorData?.weeklyReports?.[mentorData.weeklyReports.length - 1];
  const TABS = [
    { id: "today",   label: "Today"       },
    { id: "week",    label: "This Week"   },
    { id: "history", label: "All History" },
  ] as const;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#050505;overflow-x:hidden;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#1f1f1f;border-radius:2px;}
        @keyframes fadeUp   {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanline {0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
        @keyframes spin     {to{transform:rotate(360deg)}}
        @keyframes pulse    {0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes glow     {0%,100%{box-shadow:0 0 20px ${ACCENT}40}50%{box-shadow:0 0 40px ${ACCENT}80}}
        @keyframes slideUp  {from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.4s ease both;}
        .panel{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:24px;}
        .tab-btn{flex:1;padding:10px 8px;border-radius:8px;border:none;cursor:pointer;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:0.08em;transition:all 0.2s;background:transparent;min-height:46px;-webkit-tap-highlight-color:transparent;}
        .gen-btn{width:100%;padding:16px;background:${ACCENT};color:#050505;font-family:'Space Mono',monospace;font-weight:700;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;border:none;border-radius:12px;cursor:pointer;transition:all 0.2s;animation:glow 3s ease infinite;min-height:54px;-webkit-tap-highlight-color:transparent;}
        .gen-btn:hover{background:#d4ff33;transform:translateY(-1px);}
        .gen-btn:disabled{background:#1a1a1a;color:#444;cursor:not-allowed;transform:none;animation:none;}
        .chat-bubble-user{background:${ACCENT};color:#050505;border-radius:12px 12px 2px 12px;padding:10px 14px;font-family:'Space Mono',monospace;font-size:11px;line-height:1.6;max-width:85%;align-self:flex-end;}
        .chat-bubble-mentor{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);border-radius:12px 12px 12px 2px;padding:10px 14px;font-family:'Space Mono',monospace;font-size:11px;line-height:1.6;max-width:90%;align-self:flex-start;}
        @media(max-width:768px){.panel{padding:16px;}.chat-panel{bottom:0!important;right:0!important;left:0!important;width:100%!important;height:75vh!important;border-radius:20px 20px 0 0!important;}}
      `}</style>

      <main style={{ minHeight:"100vh", background:"#050505", color:"white", padding:isMobile?"20px 16px":"40px 24px", position:"relative", paddingBottom:isMobile?100:40 }}>
        <div style={{ position:"fixed", inset:0, backgroundImage:`linear-gradient(rgba(200,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.025) 1px,transparent 1px)`, backgroundSize:"60px 60px", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", top:0, left:0, right:0, height:"2px", background:"linear-gradient(90deg,transparent,rgba(200,255,0,0.15),transparent)", animation:"scanline 8s linear infinite", pointerEvents:"none", zIndex:0 }} />

        {/* Chat button */}
        <button onClick={() => setChatOpen(o => !o)}
          style={{ position:"fixed", bottom:isMobile?24:32, right:isMobile?16:32, zIndex:200, width:56, height:56, borderRadius:"50%", background:chatOpen?"rgba(255,255,255,0.1)":ACCENT, color:chatOpen?"white":"#050505", border:chatOpen?"1px solid rgba(255,255,255,0.2)":"none", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:`0 4px 24px ${ACCENT}40`, transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Space Mono',monospace", letterSpacing:"0.05em" }}>
          {chatOpen ? "✕" : "Chat"}
        </button>

        {/* Chat panel */}
        {chatOpen && (
          <div className="chat-panel" style={{ position:"fixed", bottom:100, right:32, width:380, height:480, background:"#0D0D0D", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, zIndex:199, display:"flex", flexDirection:"column", overflow:"hidden", animation:"slideUp 0.3s ease", boxShadow:"0 24px 64px rgba(0,0,0,0.8)" }}>
            <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${ACCENT},#8FFF00)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#050505", fontFamily:"'Space Mono',monospace" }}>AI</div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, color:"white" }}>AI Mentor</div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:GREEN, letterSpacing:"0.1em" }}>ONLINE</div>
              </div>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign:"center", padding:"32px 16px" }}>
                  <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.3)", lineHeight:1.7 }}>Ask me anything about your startup — strategy, fundraising, hiring, pricing, growth. I will be direct.</p>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-mentor"}>
                  {m.text}
                </div>
              ))}
              {chatLoading && (
                <div className="chat-bubble-mentor" style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:ACCENT, animation:`pulse 1s ${i*0.2}s ease infinite` }} />)}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding:"12px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:8 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Ask your mentor..." style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"white", fontFamily:"'Space Mono',monospace", fontSize:12, outline:"none", minHeight:44 }} />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                style={{ width:44, height:44, borderRadius:8, background:ACCENT, color:"#050505", border:"none", cursor:"pointer", fontSize:16, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>→</button>
            </div>
          </div>
        )}

        <div style={{ maxWidth:860, margin:"0 auto", position:"relative", zIndex:1 }}>

          {/* Header */}
          <div className="fade-up" style={{ marginBottom:isMobile?20:32 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <div style={{ width:40, height:40, borderRadius:"50%", background:`linear-gradient(135deg,${ACCENT},#8FFF00)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#050505", flexShrink:0, fontFamily:"'Space Mono',monospace" }}>AI</div>
              <div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.25em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>CORTIQ — AI MENTOR</div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:GREEN, letterSpacing:"0.1em" }}>Live — Powered by Groq</div>
              </div>
              {mentorData && (
                <div style={{ marginLeft:"auto", display:"flex", gap:16 }}>
                  {[{label:"STREAK",value:`${mentorData.streak}x`},{label:"DONE",value:mentorData.totalDone},{label:"THIS WEEK",value:`${completionPct}%`}].map(s => (
                    <div key={s.label} style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.25)", marginBottom:2 }}>{s.label}</div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, color:ACCENT }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:isMobile?"clamp(26px,7vw,36px)":"clamp(30px,4vw,46px)", fontWeight:800, lineHeight:1.05, letterSpacing:"-0.02em" }}>
              Your AI Mentor<br /><span style={{ color:ACCENT }}>Every. Single. Day.</span>
            </h1>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:10, lineHeight:1.6 }}>
              One focused task per day. Weekly honest feedback. Ask anything, anytime.
            </p>
          </div>

          {/* Weekly progress bar */}
          {mentorData && thisWeekTasks.length > 0 && (
            <div className="panel fade-up" style={{ marginBottom:14, padding:isMobile?"14px":"18px 24px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.15em" }}>This Week</span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:completionPct>=70?ACCENT:completionPct>=40?ORANGE:RED }}>{thisWeekDone}/{thisWeekTasks.length} — {completionPct}%</span>
              </div>
              <div style={{ width:"100%", height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${completionPct}%`, background:completionPct>=70?ACCENT:completionPct>=40?ORANGE:RED, borderRadius:4, transition:"width 1s ease" }} />
              </div>
              <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                {thisWeekTasks.map(t => (
                  <div key={t.id} title={t.title} style={{ width:28, height:28, borderRadius:6, background:t.done?ACCENT:t.skipped?"rgba(255,255,255,0.05)":AREA_META[t.area].color+"15", border:`1px solid ${t.done?ACCENT:t.skipped?"rgba(255,255,255,0.08)":AREA_META[t.area].color+"30"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:t.done?"#050505":AREA_META[t.area].color, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>
                    {t.done?"OK":t.skipped?"-":t.area.slice(0,2).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display:"flex", gap:4, marginBottom:16, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:4 }}>
            {TABS.map(t => (
              <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)}
                style={{ color:activeTab===t.id?"#050505":"rgba(255,255,255,0.4)", background:activeTab===t.id?ACCENT:"transparent", fontWeight:activeTab===t.id?700:400 }}>
                {t.label}
              </button>
            ))}
          </div>

          {error && <div style={{ padding:"12px 16px", background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:10, fontFamily:"'Space Mono',monospace", fontSize:11, color:RED, marginBottom:14 }}>{error}</div>}

          {/* TODAY TAB */}
          {activeTab === "today" && (
            <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {!todayTask ? (
                <div className="panel" style={{ textAlign:"center", padding:isMobile?"24px":"48px 40px", borderColor:`${ACCENT}20`, background:`${ACCENT}04` }}>
                  <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:isMobile?20:24, color:"white", marginBottom:10 }}>No task yet for today</h2>
                  <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.35)", lineHeight:1.7, maxWidth:420, margin:"0 auto 24px" }}>
                    Your mentor will analyze your startup data and give you one focused, high-impact task for today.
                  </p>
                  <button className="gen-btn" onClick={generateTask} disabled={genLoading} style={{ maxWidth:360, margin:"0 auto" }}>
                    {genLoading ? `Analyzing${tick % 2 === 0 ? "..." : "   "}` : "Get Today's Task"}
                  </button>
                </div>
              ) : (
                <TaskCard task={todayTask} onDone={() => markDone(todayTask.id)} onSkip={() => markSkip(todayTask.id)} onReflect={text => addReflection(todayTask.id, text)} isMobile={isMobile} />
              )}

              {mentorData && mentorData.totalDone > 0 && (
                <div className="panel" style={{ borderColor:`${ORANGE}20`, background:`${ORANGE}04` }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:ORANGE, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:8 }}>Your Momentum</div>
                  <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.65)", lineHeight:1.7 }}>
                    You have completed <span style={{ color:ACCENT, fontWeight:700 }}>{mentorData.totalDone} tasks</span> total with a <span style={{ color:ORANGE, fontWeight:700 }}>{mentorData.streak}-task streak</span>. {mentorData.streak >= 7 ? "You are building a real habit. Serious founders show up every day." : mentorData.streak >= 3 ? "3 or more in a row. The habit is forming — do not break it now." : "Every task done is a step forward. Show up tomorrow."}
                  </p>
                </div>
              )}

              {!mentorData && (
                <div className="panel">
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:12 }}>How it works</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {[
                      { title:"Daily task",    desc:"One focused task each morning, chosen from your weakest area" },
                      { title:"Weekly report", desc:"Honest assessment — improving, steady, or slipping. No sugarcoating." },
                      { title:"Ask anything",  desc:"Chat with your mentor 24/7 — strategy, decisions, anything." },
                    ].map(s => (
                      <div key={s.title} style={{ display:"flex", gap:12 }}>
                        <div style={{ width:36, height:36, minWidth:36, borderRadius:8, background:`${ACCENT}12`, border:`1px solid ${ACCENT}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:ACCENT, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>AI</div>
                        <div>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:"white", marginBottom:3 }}>{s.title}</div>
                          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => router.push("/")} style={{ marginTop:16, padding:"10px 18px", background:"rgba(200,255,0,0.08)", border:"1px solid rgba(200,255,0,0.2)", color:ACCENT, fontFamily:"'Space Mono',monospace", fontSize:10, borderRadius:8, cursor:"pointer", minHeight:40 }}>
                    Run Analysis First →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* WEEK TAB */}
          {activeTab === "week" && (
            <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {thisWeekTasks.length > 0 ? (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:4 }}>This Week's Tasks</div>
                  {thisWeekTasks.map(task => (
                    <TaskCard key={task.id} task={task} onDone={() => markDone(task.id)} onSkip={() => markSkip(task.id)} onReflect={text => addReflection(task.id, text)} isMobile={isMobile} />
                  ))}
                </div>
              ) : (
                <div className="panel" style={{ textAlign:"center", padding:"48px 20px" }}>
                  <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:16 }}>No tasks this week yet — generate today's task first</p>
                  <button onClick={() => setActiveTab("today")} style={{ padding:"12px 24px", background:ACCENT, color:"#050505", fontFamily:"'Space Mono',monospace", fontSize:11, fontWeight:700, border:"none", borderRadius:10, cursor:"pointer", minHeight:48 }}>Go to Today</button>
                </div>
              )}
              <div className="panel" style={{ borderColor:`${CYAN}15` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, flexWrap:"wrap", gap:10 }}>
                  <div>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:CYAN, textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:6 }}>Weekly Report</div>
                    <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.3)", lineHeight:1.6 }}>
                      {thisWeekTasks.length > 0 ? `${thisWeekDone}/${thisWeekTasks.length} tasks done. ` : "No tasks yet. "}Your mentor will review your progress honestly.
                    </p>
                  </div>
                  <button onClick={generateWeeklyReport} disabled={weekLoading || thisWeekTasks.length === 0}
                    style={{ padding:"12px 20px", background:CYAN, color:"#050505", fontFamily:"'Space Mono',monospace", fontSize:11, fontWeight:700, border:"none", borderRadius:10, cursor:"pointer", minHeight:48, opacity:thisWeekTasks.length===0?0.4:1 }}>
                    {weekLoading ? "Reviewing..." : "Get Weekly Review"}
                  </button>
                </div>
                {latestReport && latestReport.weekStart === weekStart() && <WeeklyReportCard report={latestReport} isMobile={isMobile} />}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {mentorData?.weeklyReports && mentorData.weeklyReports.length > 0 && (
                <div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:12 }}>Past Weekly Reports</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {[...mentorData.weeklyReports].reverse().map((r, i) => <WeeklyReportCard key={i} report={r} isMobile={isMobile} />)}
                  </div>
                </div>
              )}
              {mentorData?.tasks && mentorData.tasks.length > 0 && (
                <div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:12 }}>All Tasks ({mentorData.tasks.length})</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[...mentorData.tasks].reverse().map(task => {
                      const meta = AREA_META[task.area];
                      return (
                        <div key={task.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"rgba(255,255,255,0.02)", border:`1px solid ${task.done?GREEN+"20":task.skipped?"rgba(255,255,255,0.05)":meta.color+"15"}`, borderRadius:10 }}>
                          <div style={{ width:28, height:28, minWidth:28, borderRadius:6, background:task.done?`${GREEN}20`:task.skipped?"rgba(255,255,255,0.05)":`${meta.color}12`, border:`1px solid ${task.done?GREEN+"40":task.skipped?"rgba(255,255,255,0.08)":meta.color+"25"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:task.done?GREEN:task.skipped?"rgba(255,255,255,0.3)":meta.color, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>
                            {task.done?"OK":task.skipped?"-":task.area.slice(0,2).toUpperCase()}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.6)", textDecoration:task.done?"line-through":"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:isMobile?"normal":"nowrap" }}>{task.title}</div>
                            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.25)", marginTop:2 }}>{task.date} — {meta.label}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {(!mentorData || mentorData.tasks.length === 0) && (
                <div className="panel" style={{ textAlign:"center", padding:"64px 20px" }}>
                  <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:20 }}>No history yet. Start by getting today's task.</p>
                  <button onClick={() => setActiveTab("today")} style={{ padding:"12px 24px", background:ACCENT, color:"#050505", fontFamily:"'Space Mono',monospace", fontSize:11, fontWeight:700, border:"none", borderRadius:10, cursor:"pointer", minHeight:48 }}>Get Started</button>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop:48, paddingTop:20, borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:isMobile?"column":"row", justifyContent:"space-between", gap:6 }}>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.2)" }}>CORTIQ — AI MENTOR</span>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.2)" }}>POWERED BY GROQ</span>
          </div>
        </div>
      </main>
    </>
  );
}