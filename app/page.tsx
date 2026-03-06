"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
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

export default function Home() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [form, setForm] = useState({
    idea: "",
    customer: "",
    geography: "",
    tam: "",
    competitors: "",
    pricing: "",
    cac: "",
    monthly_burn: "",
    current_revenue: "",
    available_budget: "",
    team_size: "",
    founder_experience: "",
    situation: ""
  });

  const [result, setResult] = useState<ResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [chat, setChat] = useState<any[]>([
    {
      role: "assistant",
      content:
        "I’m your Cortiq AI Coach. Run analysis first, then ask how to improve."
    }
  ]);
  const [message, setMessage] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ================= ANALYZE =================
  const handleAnalyze = async () => {
    if (!API) {
      setError("Backend not configured.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        mode: "full",
        strategy_mode: "growth",
        ...form,
        tam: Number(form.tam) || 0,
        pricing: Number(form.pricing) || 0,
        cac: Number(form.cac) || 0,
        monthly_burn: Number(form.monthly_burn) || 0,
        current_revenue: Number(form.current_revenue) || 0,
        available_budget: Number(form.available_budget) || 0,
        team_size: Number(form.team_size) || 0,
        competitors: form.competitors
          ? form.competitors.split(",").map(c => c.trim())
          : []
      };

      const res = await fetch(`${API}/dashboard/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Backend error");
      }

      const data = await res.json();

      if (!data || !data.health_score) {
        throw new Error("Invalid response");
      }

      setResult(data);

      setChat([
        {
          role: "assistant",
          content:
            "Analysis complete. Ask me how to improve market strength, reduce risk, or optimize growth."
        }
      ]);

    } catch {
      setError("Failed to analyze startup.");
    } finally {
      setLoading(false);
    }
  };

  // ================= AI COACH =================
  const sendMessage = async () => {
    if (!message.trim() || !result) return;

    const userMessage = message;
    setMessage("");
    setCoachLoading(true);

    setChat(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await fetch(`${API}/coach/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          metrics: result
        })
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      setChat(prev => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ||
            "Focus on improving capital efficiency and differentiation."
        }
      ]);

    } catch {
      setChat(prev => [
        ...prev,
        {
          role: "assistant",
          content:
            "AI Coach temporarily unavailable. Improve financial efficiency and strategic positioning."
        }
      ]);
    } finally {
      setCoachLoading(false);
    }
  };

  const runwayData =
    result && Number(form.monthly_burn) > 0
      ? Array.from({ length: 12 }, (_, i) => ({
          month: `M${i + 1}`,
          cash:
            Number(form.available_budget) -
            Number(form.monthly_burn) * i
        }))
      : [];

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* NAV */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <Image src="/logo.png" alt="Cortiq" width={100} height={30} />
          <span className="text-xs tracking-[0.3em] text-gray-400">
            STARTUP INTELLIGENCE TERMINAL
          </span>
        </div>

        <h1 className="text-4xl font-bold mt-10 mb-8">
          Strategic Startup Assessment
        </h1>

        {/* FORM */}
        <div className="grid md:grid-cols-2 gap-6">
          {Object.keys(form).map((key) => (
            <input
              key={key}
              value={(form as any)[key]}
              placeholder={key.replace("_", " ").toUpperCase()}
              onChange={(e)=>updateField(key, e.target.value)}
              className="p-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-white"
            />
          ))}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-8 w-full bg-white text-black p-4 rounded-xl font-bold hover:bg-gray-200 transition"
        >
          {loading ? "Analyzing..." : "Run Strategic Analysis"}
        </button>

        {error && <p className="text-red-400 mt-4">{error}</p>}

        {/* DASHBOARD */}
        {result && (
          <div className="mt-16 grid md:grid-cols-3 gap-8">

            {/* LEFT SIDE */}
            <div className="md:col-span-2 space-y-10">

              <div className="bg-black border border-white/10 p-8 rounded-3xl">
                <h2 className="text-xl mb-4">Risk Index</h2>
                <div className="w-full h-6 bg-white/10 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-700"
                    style={{ width: `${result.risk_score}%` }}
                  />
                </div>
              </div>

              {runwayData.length > 0 && (
                <div className="h-96 bg-black border border-white/10 p-8 rounded-3xl">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={runwayData}>
                      <XAxis dataKey="month" stroke="#aaa" />
                      <YAxis stroke="#aaa" />
                      <Tooltip />
                      <Line type="monotone" dataKey="cash" stroke="#00ff88" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <Stat title="Market Strength" value={result.market_health} />
                <Stat title="Team Strength" value={result.execution_health} />
              </div>

              <div className="bg-black border border-white/10 p-8 rounded-3xl">
                <h2 className="text-xl mb-4">Strategic Insight</h2>

                <p className="text-red-400 font-semibold mb-1">
                  Biggest Weakness
                </p>
                <p className="mb-6">{result.biggest_problem}</p>

                <p className="text-green-400 font-semibold mb-2">
                  Action Plan
                </p>
                <ul className="space-y-2 mb-6">
                  {result.improvements.map((step, i) => (
                    <li key={i}>• {step}</li>
                  ))}
                </ul>

                <div className="p-4 bg-white/5 rounded-xl text-gray-300">
                  {result.insight}
                </div>
              </div>

            </div>

            {/* AI COACH */}
            <div className="bg-black border border-white/10 p-6 rounded-3xl h-[600px] flex flex-col">

              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">🤖</div>
                <div>
                  <p className="text-sm text-gray-400">Cortiq AI Coach</p>
                  <p className="font-semibold">Interactive Strategic Advisor</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 text-sm mb-4">
                {chat.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl ${
                      msg.role === "assistant"
                        ? "bg-white/5"
                        : "bg-blue-500/20 text-right"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {coachLoading && (
                  <div className="text-gray-400 text-xs">
                    AI Coach thinking...
                  </div>
                )}
                <div ref={chatEndRef}></div>
              </div>

              <div className="flex gap-2">
                <input
                  value={message}
                  onChange={(e)=>setMessage(e.target.value)}
                  onKeyDown={(e)=>{
                    if (e.key === "Enter") sendMessage();
                  }}
                  className="flex-1 p-2 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:border-white"
                  placeholder="Ask how to improve..."
                />
                <button
                  onClick={sendMessage}
                  className="bg-white text-black px-4 rounded-xl"
                >
                  Send
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}

function Stat({ title, value }: any) {
  return (
    <div className="bg-black border border-white/10 p-6 rounded-3xl">
      <h3 className="text-gray-400">{title}</h3>
      <p className="text-5xl font-bold">{value}</p>
    </div>
  );
}