"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/supabase";

const ACCENT = "#C8FF00";

const MAIN_NAV = [
  { href: "/",            label: "Dashboard"  },
  { href: "/mentor",      label: "Mentor"     },
  { href: "/simulate",    label: "Simulator"  },
  { href: "/competitors", label: "Competitors"},
  { href: "/pitch",       label: "Pitch Deck" },
  { href: "/improve",     label: "Improve"    },
];

const MORE_NAV = [
  { href: "/progress", label: "Progress"   },
  { href: "/okr",      label: "OKRs"       },
  { href: "/export",   label: "Export PDF" },
];

export default function Nav() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".more-wrap")) setMoreOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  if (pathname === "/login" || pathname === "/landing") return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

        .nav-item {
          display: flex; align-items: center;
          padding: 7px 13px; border-radius: 8px; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 0.08em; border: 1px solid transparent;
          background: transparent; color: rgba(255,255,255,0.38);
          transition: all 0.15s; white-space: nowrap; min-height: 36px;
          -webkit-tap-highlight-color: transparent; flex-shrink: 0;
        }
        .nav-item:hover  { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.04); }
        .nav-item.active { color: ${ACCENT}; background: rgba(200,255,0,0.08); border-color: rgba(200,255,0,0.2); }

        .nav-links { display: flex; align-items: center; gap: 1px; overflow-x: auto; scrollbar-width: none; }
        .nav-links::-webkit-scrollbar { display: none; }

        .more-wrap { position: relative; }

        .dropdown {
          position: absolute; top: calc(100% + 8px); left: 0;
          background: #0c0c0c; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 6px; display: flex;
          flex-direction: column; gap: 2px; min-width: 150px; z-index: 300;
          box-shadow: 0 16px 48px rgba(0,0,0,0.8);
        }
        .dropdown-item {
          padding: 9px 12px; background: transparent; border: none;
          color: rgba(255,255,255,0.55); font-family: 'Space Mono', monospace;
          font-size: 10px; letter-spacing: 0.06em; text-align: left;
          cursor: pointer; border-radius: 7px; transition: all 0.15s; white-space: nowrap;
        }
        .dropdown-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.9); }
        .dropdown-item.active { color: ${ACCENT}; background: rgba(200,255,0,0.08); }

        .signout-btn {
          padding: 7px 13px; border-radius: 8px; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 9px;
          letter-spacing: 0.1em; border: 1px solid rgba(255,255,255,0.1);
          background: transparent; color: rgba(255,255,255,0.3);
          transition: all 0.2s; white-space: nowrap; min-height: 36px; flex-shrink: 0;
        }
        .signout-btn:hover { border-color: rgba(255,68,68,0.4); color: #FF6B6B; }

        .hamburger {
          display: none; flex-direction: column; justify-content: center;
          gap: 5px; width: 36px; height: 36px; padding: 8px;
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; cursor: pointer; flex-shrink: 0;
        }
        .hamburger span { display: block; height: 1.5px; background: rgba(255,255,255,0.6); border-radius: 2px; transition: all 0.2s; }

        .mobile-menu {
          display: none; position: fixed; top: 53px; left: 0; right: 0; bottom: 0;
          background: rgba(5,5,5,0.98); backdrop-filter: blur(20px);
          z-index: 99; flex-direction: column; padding: 12px 16px 24px; gap: 3px; overflow-y: auto;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu .nav-item { font-size: 13px; padding: 13px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.55); min-height: 50px; }
        .mobile-menu .nav-item.active { color: ${ACCENT}; background: rgba(200,255,0,0.08); border-color: rgba(200,255,0,0.2); }

        @media (max-width: 900px) {
          .hamburger   { display: flex !important; }
          .desktop-nav { display: none !important; }
          .user-section { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5,5,5,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, minHeight: 53,
      }}>
        {/* Logo */}
        <div onClick={() => { router.push("/"); setMenuOpen(false); }}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", marginRight: 6, flexShrink: 0 }}>
          <img src="/cortiq-logo-v2.svg" alt="Cortiq" style={{ height: 32, width: "auto" }} />
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
          <div className="nav-links">
            {MAIN_NAV.map(item => {
              const active = pathname === item.href;
              return (
                <button key={item.href} className={`nav-item${active ? " active" : ""}`}
                  onClick={() => router.push(item.href)}>
                  {item.label}
                </button>
              );
            })}

            <div className="more-wrap">
              <button className={`nav-item${MORE_NAV.some(i => i.href === pathname) ? " active" : ""}`}
                onClick={(e) => { e.stopPropagation(); setMoreOpen(o => !o); }}>
                More {moreOpen ? "v" : ">"}
              </button>
              {moreOpen && (
                <div className="dropdown">
                  {MORE_NAV.map(item => (
                    <button key={item.href} className={`dropdown-item${pathname === item.href ? " active" : ""}`}
                      onClick={() => { router.push(item.href); setMoreOpen(false); }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User */}
        {user && (
          <div className="user-section" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar"
                style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />
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

        {/* Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)}
          style={{ marginLeft: user ? 8 : "auto" }}>
          <span style={{ transform: menuOpen ? "rotate(45deg) translate(4px, 4px)" : "none" }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? "rotate(-45deg) translate(4px, -4px)" : "none" }} />
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        {[...MAIN_NAV, ...MORE_NAV].map(item => {
          const active = pathname === item.href;
          return (
            <button key={item.href} className={`nav-item${active ? " active" : ""}`}
              onClick={() => { router.push(item.href); setMenuOpen(false); }}>
              {item.label}
            </button>
          );
        })}
        {user && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar"
                style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />
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