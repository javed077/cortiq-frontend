"use client";

import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/supabase";

const ACCENT = "#C8FF00";

const NAV_ITEMS = [
  { href: "/",            icon: "⬡", label: "Dashboard"    },
  { href: "/progress",    icon: "🔥", label: "Progress"     },
  { href: "/simulate",    icon: "◎", label: "Simulator"    },
  { href: "/competitors", icon: "⊕", label: "Competitors"  },
  { href: "/okr",         icon: "◈", label: "OKRs"         },
  { href: "/export",      icon: "↓", label: "Export PDF"   },
  { href: "/pitch",       icon: "★", label: "Pitch Deck"   },
  { href: "/improve",     icon: "△", label: "Improve"      },
];

export default function Nav() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useUser();

  // don't render nav on login page
  if (pathname === "/login") return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        .nav-item {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 14px; border-radius: 8px; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 0.1em; border: none; background: transparent;
          transition: all 0.2s; white-space: nowrap;
        }
        .nav-item:hover { background: rgba(255,255,255,0.05); }
        .nav-item.active { background: rgba(200,255,0,0.1); border: 1px solid rgba(200,255,0,0.2); }
        .signout-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 8px; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 9px;
          letter-spacing: 0.1em; border: 1px solid rgba(255,255,255,0.1);
          background: transparent; color: rgba(255,255,255,0.35);
          transition: all 0.2s; white-space: nowrap;
        }
        .signout-btn:hover { border-color: rgba(255,68,68,0.4); color: #FF6B6B; }
      `}</style>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5,5,5,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 4,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 28 }}>
  <div style={{
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: ACCENT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12
  }}>
    ⬡
  </div>

  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
    <span style={{
      fontFamily: "'Space Mono',monospace",
      fontSize: 11,
      fontWeight: 700,
      color: "white",
      letterSpacing: "0.05em"
    }}>
      CORTIQ
    </span>

    <span style={{
      fontFamily: "'Space Mono',monospace",
      fontSize: 8,
      color: "rgba(255,255,255,0.35)",
      letterSpacing: "0.08em"
    }}>
      Startup Intelligence
    </span>
  </div>
</div>

        {/* nav links */}
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              className={`nav-item ${active ? "active" : ""}`}
              onClick={() => router.push(item.href)}
              style={{ color: active ? ACCENT : "rgba(255,255,255,0.4)" }}
            >
              <span style={{ fontSize: 11 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}

        {/* user info + sign out */}
        {user && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            {/* avatar */}
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 10, color: ACCENT }}>
                {user.email?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.user_metadata?.full_name || user.email}
            </span>
            <button className="signout-btn" onClick={signOut}>Sign out</button>
          </div>
        )}
      </nav>
    </>
  );
}