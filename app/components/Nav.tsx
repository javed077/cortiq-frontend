"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/supabase";

const ACCENT = "#C8FF00";

const NAV_ITEMS = [
  { href: "/",            label: "Dashboard"   },
  { href: "/progress",    label: "Progress"    },
  { href: "/simulate",    label: "Simulator"   },
  { href: "/mentor",      label: "Mentor"      },
  { href: "/competitors", label: "Competitors" },
  { href: "/okr",         label: "OKRs"        },
  { href: "/pitch",       label: "Pitch Deck"  },
  { href: "/improve",     label: "Improve"     },
];

export default function Nav() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFade, setShowFade] = useState(false);
  const navLinksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = navLinksRef.current;
    if (!el) return;
    const check = () => setShowFade(el.scrollWidth > el.clientWidth + 4);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (pathname === "/login" || pathname === "/landing") return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        .nav-item {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 8px; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 0.08em; border: 1px solid transparent;
          background: transparent; color: rgba(255,255,255,0.38);
          transition: all 0.15s; white-space: nowrap; min-height: 36px;
          -webkit-tap-highlight-color: transparent; flex-shrink: 0;
        }
        .nav-item:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); }
        .nav-item.active { color: ${ACCENT}; background: rgba(200,255,0,0.08); border-color: rgba(200,255,0,0.2); }
        .nav-links-wrap { position: relative; flex: 1; overflow: hidden; min-width: 0; }
        .nav-links { display: flex; align-items: center; gap: 1px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; -ms-overflow-style: none; }
        .nav-links::-webkit-scrollbar { display: none; }
        .nav-fade { position: absolute; top: 0; right: 0; bottom: 2px; width: 40px; pointer-events: none; background: linear-gradient(to right, transparent, rgba(5,5,5,0.95)); }
        .signout-btn { display: flex; align-items: center; padding: 7px 12px; border-radius: 8px; cursor: pointer; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.3); transition: all 0.2s; white-space: nowrap; min-height: 36px; }
        .signout-btn:hover { border-color: rgba(255,68,68,0.4); color: #FF6B6B; }
        .hamburger { display: none; flex-direction: column; justify-content: center; gap: 5px; width: 36px; height: 36px; padding: 8px; background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; flex-shrink: 0; }
        .hamburger span { display: block; height: 1.5px; background: rgba(255,255,255,0.6); border-radius: 2px; transition: all 0.2s; }
        .mobile-menu { display: none; position: fixed; top: 53px; left: 0; right: 0; bottom: 0; background: rgba(5,5,5,0.98); backdrop-filter: blur(20px); z-index: 99; flex-direction: column; padding: 12px 16px 24px; gap: 3px; overflow-y: auto; }
        .mobile-menu.open { display: flex; }
        .mobile-menu .nav-item { font-size: 13px; padding: 13px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.55); min-height: 50px; }
        .mobile-menu .nav-item.active { color: ${ACCENT}; background: rgba(200,255,0,0.08); border-color: rgba(200,255,0,0.2); }
        @media (max-width: 900px) { .hamburger { display: flex !important; } .nav-links-wrap { display: none !important; } .user-section { display: none !important; } }
      `}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(5,5,5,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, minHeight: 53 }}>
        <div onClick={() => { router.push("/"); setMenuOpen(false); }} style={{ marginRight: 6, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
          <img src="/cortiq-logo-v2.svg" alt="Cortiq" style={{ height: 32, width: "auto" }} />
        </div>

        <div className="nav-links-wrap">
          <div className="nav-links" ref={navLinksRef}>
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href;
              return (
                <button key={item.href} className={`nav-item${active ? " active" : ""}`} onClick={() => router.push(item.href)}>
                  {item.label}
                </button>
              );
            })}
          </div>
          {showFade && <div className="nav-fade" />}
        </div>

        {user && (
          <div className="user-section" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />
            ) : (
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 9, color: ACCENT, flexShrink: 0 }}>
                {user.email?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.28)", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.user_metadata?.full_name || user.email}
            </span>
            <button className="signout-btn" onClick={signOut}>Sign out</button>
          </div>
        )}

        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} style={{ marginLeft: user ? 8 : "auto" }}>
          <span style={{ transform: menuOpen ? "rotate(45deg) translate(4px, 4px)" : "none" }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? "rotate(-45deg) translate(4px, -4px)" : "none" }} />
        </button>
      </nav>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href;
          return (
            <button key={item.href} className={`nav-item${active ? " active" : ""}`} onClick={() => { router.push(item.href); setMenuOpen(false); }}>
              {item.label}
            </button>
          );
        })}
        {user && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 11, color: ACCENT }}>
                {user.email?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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