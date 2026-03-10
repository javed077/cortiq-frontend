"use client";

import { useRouter, usePathname } from "next/navigation";

const ACCENT = "#C8FF00";

const NAV_ITEMS = [
  { href: "/",            icon: "⬡", label: "Dashboard"    },
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
      `}</style>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5,5,5,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 4,
      }}>
        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 24 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>⬡</div>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>CORTIQ</span>
        </div>

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
      </nav>
    </>
  );
}