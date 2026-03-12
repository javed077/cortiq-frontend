"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/supabase";

const ACCENT = "#C8FF00";

const NAV_ITEMS = [
  { href: "/",            icon: "⬡", label: "Dashboard"   },
  { href: "/progress",    icon: "🔥", label: "Progress"    },
  { href: "/simulate",    icon: "◎", label: "Simulator"   },
  { href: "/competitors", icon: "⊕", label: "Competitors" },
  { href: "/okr",         icon: "◈", label: "OKRs"        },
  { href: "/export",      icon: "↓", label: "Export PDF"  },
  { href: "/pitch",       icon: "★", label: "Pitch Deck"  },
  { href: "/improve",     icon: "△", label: "Improve"     },
];

export default function Nav() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/login" || pathname === "/landing") return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

        .nav-item {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 14px; border-radius: 8px; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 0.1em; border: none; background: transparent;
          transition: all 0.2s; white-space: nowrap; min-height: 40px;
          -webkit-tap-highlight-color: transparent;
        }
        .nav-item:hover  { background: rgba(255,255,255,0.05); }
        .nav-item.active { background: rgba(200,255,0,0.1); border: 1px solid rgba(200,255,0,0.2); }

        .signout-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 8px; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 9px;
          letter-spacing: 0.1em; border: 1px solid rgba(255,255,255,0.1);
          background: transparent; color: rgba(255,255,255,0.35);
          transition: all 0.2s; white-space: nowrap; min-height: 40px;
          -webkit-tap-highlight-color: transparent;
        }
        .signout-btn:hover { border-color: rgba(255,68,68,0.4); color: #FF6B6B; }

        .hamburger {
          display: none; flex-direction: column; justify-content: center;
          gap: 5px; width: 40px; height: 40px; padding: 8px;
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .hamburger span {
          display: block; height: 1.5px; background: rgba(255,255,255,0.6);
          border-radius: 2px; transition: all 0.2s;
        }

        /* desktop nav scrollable */
        .nav-links {
          display: flex; align-items: center; gap: 2px;
          overflow-x: auto; flex: 1;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        .nav-links::-webkit-scrollbar { display: none; }

        /* mobile drawer */
        .mobile-menu {
          display: none;
          position: fixed; top: 57px; left: 0; right: 0; bottom: 0;
          background: rgba(5,5,5,0.98); backdrop-filter: blur(20px);
          z-index: 99; flex-direction: column;
          padding: 16px; gap: 4px; overflow-y: auto;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu .nav-item {
          font-size: 13px; padding: 14px 16px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
          min-height: 52px;
        }
        .mobile-menu .nav-item.active {
          background: rgba(200,255,0,0.08);
          border-color: rgba(200,255,0,0.2);
        }

        @media (max-width: 768px) {
          .hamburger { display: flex !important; }
          .nav-links  { display: none !important; }
          .user-section { display: none !important; }
        }
      `}</style>

      {/* ── DESKTOP / TABLET NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5,5,5,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 16px", display: "flex", alignItems: "center", gap: 8,
      }}>

        {/* logo */}
        <div onClick={() => { router.push("/"); setMenuOpen(false); }}
          style={{ marginRight: 8, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
          <img src="/cortiq-logo-v2.svg" alt="Cortiq" style={{ height: 36, width: "auto" }} />
        </div>

        {/* desktop links */}
        <div className="nav-links">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <button key={item.href} className={`nav-item ${active ? "active" : ""}`}
                onClick={() => router.push(item.href)}
                style={{ color: active ? ACCENT : "rgba(255,255,255,0.4)" }}>
                <span style={{ fontSize: 11 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* user section desktop */}
        {user && (
          <div className="user-section" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar"
                style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 10, color: ACCENT }}>
                {user.email?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.user_metadata?.full_name || user.email}
            </span>
            <button className="signout-btn" onClick={signOut}>Sign out</button>
          </div>
        )}

        {/* hamburger — mobile only */}
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} style={{ marginLeft: "auto" }}>
          <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href;
          return (
            <button key={item.href} className={`nav-item ${active ? "active" : ""}`}
              onClick={() => { router.push(item.href); setMenuOpen(false); }}
              style={{ color: active ? ACCENT : "rgba(255,255,255,0.6)" }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}

        {/* user + sign out in drawer */}
        {user && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar"
                style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 12, color: ACCENT }}>
                {user.email?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                {user.user_metadata?.full_name || user.email}
              </div>
            </div>
            <button className="signout-btn" onClick={() => { signOut(); setMenuOpen(false); }}>Sign out</button>
          </div>
        )}
      </div>
    </>
  );
}