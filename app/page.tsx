"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {

  const API = process.env.NEXT_PUBLIC_API_URL;

  const [form, setForm] = useState({
    idea: "",
    customer: "",
    pricing: "",
    team_size: 1,
    budget: "",
    situation: ""
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ======================
  // SCORE ANIMATION
  // ======================
  useEffect(() => {
    if (!result) return;

    let current = 0;
    const target = result.health_score;

    const interval = setInterval(() => {
      current += 2;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setAnimatedScore(current);
    }, 20);

    return () => clearInterval(interval);
  }, [result]);

  // ======================
  // ANALYZE
  // ======================
  const handleAnalyze = async () => {

    if (!API) {
      setError("API URL missing. Check Vercel env variables.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch(`${API}/dashboard/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          mode: "existing",
          strategy_mode: "growth",
          team_size: Number(form.team_size)
        })
      });

      const data = await res.json();

      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 700);

    } catch (err) {
      setLoading(false);
      setError("Failed to connect to backend.");
    }
  };

  const Card = ({ title, score }: any) => (
    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl transition hover:bg-white/10">
      <h3 className="text-gray-400">{title}</h3>
      <p className="text-4xl font-extrabold mt-2">{score}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white p-8">

      <div className="max-w-5xl mx-auto">

        {/* TOP NAV */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <Image
            src="/logo.png"
            alt="CORTIQ"
            width={95}
            height={30}
          />
          <span className="text-xs tracking-[0.25em] text-gray-400">
            AI STARTUP ANALYTICS
          </span>
        </div>

        {/* HERO */}
        <div className="mt-8 mb-6">
          <h1 className="text-5xl font-bold">Startup Health Engine</h1>
          <p className="text-gray-400 mt-2">
            Analyze your startup like a venture capitalist.
          </p>
        </div>

        {/* FORM */}
        <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl space-y-3">

          {["idea","customer","pricing","team_size","budget","situation"].map((f)=>(
            <input
              key={f}
              name={f}
              placeholder={f.replace("_"," ").toUpperCase()}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10"
            />
          ))}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-white text-black p-3 rounded-xl font-bold transition hover:bg-gray-200"
          >
            {loading ? "🤖 AI Analyzing..." : "Analyze Startup Health"}
          </button>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-8 text-center text-gray-400 animate-pulse">
            AI is thinking...
          </div>
        )}

        {/* RESULTS */}
        {result && (
          <div className="space-y-6 mt-8">

            <div className="bg-white/5 border border-white/10 p-10 rounded-3xl text-center">
              <p className="text-gray-400">Overall Health</p>
              <h2 className="text-8xl font-extrabold">
                {animatedScore}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card title="Market Health" score={result.market_health} />
              <Card title="Execution Health" score={result.execution_health} />
              <Card title="Finance Health" score={result.finance_health} />
              <Card title="Growth Health" score={result.growth_health} />
            </div>

            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-2">⚠ Biggest Problem</h3>
              <p>{result.biggest_problem}</p>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-2">📈 Improvement Plan</h3>
              <ul className="space-y-2">
                {result.improvements?.map((step: string, i: number) => (
                  <li key={i}>{i + 1}. {step}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-2">💡 Strategic Insight</h3>
              <p>{result.insight}</p>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}