"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#C8FF00";
const DIM = "rgba(200,255,0,0.10)";

/* animated counter */
function Counter({ target }: { target: number }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let v = 0;
    const step = Math.ceil(target / 35);

    const id = setInterval(() => {
      v += step;

      if (v >= target) {
        setVal(target);
        clearInterval(id);
      } else {
        setVal(v);
      }
    }, 20);

    return () => clearInterval(id);
  }, [target]);

  return <>{val}</>;
}

/* progress bar */
function Bar({ pct, color = ACCENT }: { pct: number; color?: string }) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setW(pct), 120);
    return () => clearTimeout(id);
  }, [pct]);

  return (
    <div
      style={{
        width: "100%",
        height: 4,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${w}%`,
          background: color,
          borderRadius: 2,
          boxShadow: `0 0 8px ${color}80`,
          transition: "width 1s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

/* loading screen */
function LoadingScreen() {
  const [dots, setDots] = useState(0);

  const steps = [
    "Parsing startup data",
    "Generating improvement guide",
    "Building 12-month roadmap",
    "Synthesizing strategy",
  ];

  const [step, setStep] = useState(0);

  useEffect(() => {
    const d = setInterval(() => setDots((p) => (p + 1) % 4), 400);
    const s = setInterval(
      () => setStep((p) => Math.min(p + 1, steps.length - 1)),
      1800
    );

    return () => {
      clearInterval(d);
      clearInterval(s);
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            border: "2px solid rgba(255,255,255,0.06)",
            borderTopColor: ACCENT,
            borderRadius: "50%",
            margin: "0 auto 32px",
            animation: "spin 0.9s linear infinite",
          }}
        />

        <h1
          style={{
            fontFamily: "Syne",
            fontSize: 28,
            fontWeight: 800,
            color: "white",
          }}
        >
          Generating Strategy{".".repeat(dots)}
        </h1>

        <div style={{ marginTop: 28 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                opacity: i <= step ? 1 : 0.3,
                marginBottom: 6,
                fontFamily: "Space Mono",
                fontSize: 12,
                color: i === step ? ACCENT : "rgba(255,255,255,0.5)",
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ImprovePage() {
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API_URL || "";

  const [guide, setGuide] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeSection, setActiveSection] = useState<number | null>(0);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cortiq_result");

    if (!stored) {
      setLoading(false);
      return;
    }

    const data = JSON.parse(stored);

    Promise.all([fetchGuide(data), fetchRoadmap(data)]).finally(() =>
      setLoading(false)
    );
  }, []);

  async function fetchGuide(data: any) {
    try {
      const res = await fetch(`${API}/improvement-guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      setGuide(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchRoadmap(data: any) {
    try {
      const res = await fetch(`${API}/startup-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      setRoadmap(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <LoadingScreen />;

  const sectionIcons = ["◎", "⬡", "△", "◇", "○", "□"];

  const monthColors = [
    ACCENT,
    "#00E5FF",
    "#FF6B6B",
    "#FFB800",
    ACCENT,
    "#00E5FF",
    "#FF6B6B",
    "#FFB800",
    ACCENT,
    "#00E5FF",
    "#FF6B6B",
    "#FFB800",
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button
          onClick={() => router.push("/")}
          style={{
            marginBottom: 24,
            padding: "8px 16px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "none",
            color: "white",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>

        <h1
          style={{
            fontFamily: "Syne",
            fontSize: 40,
            fontWeight: 800,
            marginBottom: 20,
          }}
        >
          Growth Playbook
        </h1>

        {guide?.sections?.map((section: any, i: number) => {
          const open = activeSection === i;

          return (
            <div
              key={i}
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <button
                style={{
                  width: "100%",
                  padding: 20,
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => setActiveSection(open ? null : i)}
              >
                {sectionIcons[i % sectionIcons.length]} {section.title}
              </button>

              {open && (
                <div style={{ padding: "0 20px 20px" }}>
                  <p style={{ opacity: 0.7 }}>{section.explanation}</p>
                </div>
              )}
            </div>
          );
        })}

        {roadmap?.roadmap?.map((m: any, i: number) => {
          const open = activeMonth === i;
          const color = monthColors[i % monthColors.length];

          return (
            <div
              key={i}
              style={{
                border: `1px solid ${color}30`,
                borderRadius: 12,
                padding: 18,
                marginBottom: 10,
              }}
              onClick={() => setActiveMonth(open ? null : i)}
            >
              <h3>{m.month}</h3>

              <Bar
                pct={((i + 1) / roadmap.roadmap.length) * 100}
                color={color}
              />

              {open &&
                m.tasks?.map((t: string, ti: number) => (
                  <div key={ti} style={{ fontSize: 12, opacity: 0.7 }}>
                    • {t}
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </main>
  );
}