"use client";

import { useEffect, useState } from "react";
const ACCENT = "#C8FF00"; const CYAN = "#00E5FF";
import { createClient } from "@/lib/supabase";
const supabase = createClient();

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.href = "/";
      else setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  async function signInWithGoogle() {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { access_type: "offline", prompt: "consent" } },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  if (checking) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #050505; overflow-x: hidden; }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .google-btn {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          width: 100%; padding: 16px 24px;
          background: white; color: #1a1a1a;
          font-family: 'Space Mono',monospace; font-size: 13px; font-weight: 700;
          letter-spacing: 0.08em; border: none; border-radius: 12px;
          cursor: pointer; transition: all 0.2s;
          min-height: 56px; -webkit-tap-highlight-color: transparent;
        }
        .google-btn:hover { background: #f0f0f0; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(200,255,0,0.15); }
        .google-btn:active { transform: translateY(0); }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "24px 16px" }}>
        <div style={{ position: "fixed", inset: 0, backgroundImage: `radial-gradient(rgba(200,255,0,0.12) 1px, transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" }} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,transparent,rgba(200,255,0,0.2),transparent)`, animation: "scanline 6s linear infinite", pointerEvents: "none" }} />
        <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, background: `radial-gradient(ellipse,rgba(200,255,0,0.04) 0%,transparent 70%)`, pointerEvents: "none" }} />

        <div className="fade-up" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 36, animation: "float 4s ease-in-out infinite" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${ACCENT},#8FFF00)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px ${ACCENT}40, 0 0 80px ${ACCENT}20` }}>
              <span style={{ fontSize: 28, color: "#050505" }}>⬡</span>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: isMobile ? 30 : 36, color: "white", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 10 }}>
              Welcome to<br /><span style={{ color: ACCENT }}>Cortiq</span>
            </h1>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
              AI-powered startup intelligence.<br />Sign in to track your progress.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: isMobile ? 24 : 32, backdropFilter: "blur(20px)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                { icon: "⬡", label: "Full startup health analysis", color: ACCENT },
                { icon: "🔥", label: "Weekly streak & progress hub", color: "#FF6B35" },
                { icon: "★", label: "AI pitch deck generator", color: CYAN },
                { icon: "◈", label: "OKR engine + competitor intel", color: "#A855F7" },
              ].map(f => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: f.color, width: 20, textAlign: "center", flexShrink: 0 }}>{f.icon}</span>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{f.label}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 20 }} />
            <button className="google-btn" onClick={signInWithGoogle} disabled={loading}>
              {loading ? (
                <><div style={{ width: 18, height: 18, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#1a1a1a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Redirecting to Google…</>
              ) : (
                <><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Continue with Google</>
              )}
            </button>
            {error && <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 8, fontFamily: "'Space Mono',monospace", fontSize: 10, color: "#FF6B6B" }}>⚠ {error}</div>}
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>
              By signing in you agree to our terms.<br />We never share your data.
            </p>
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: "0.2em" }}>CORTIQ · AI STARTUP INTELLIGENCE</span>
          </div>
        </div>
      </main>
    </>
  );
}