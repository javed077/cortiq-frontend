"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

// ── singleton browser client ──────────────────────────────────────────────────
// createBrowserClient is safe to call multiple times — it returns the same
// instance per URL+key pair, so no risk of multiple GoTrueClient warnings.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// named export for convenience in login page etc.
export const supabase = createClient();

// ── useUser hook ──────────────────────────────────────────────────────────────

export function useUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const client = createClient();

    // getUser() instead of getSession() — avoids refresh_token_not_found errors
    // when there is no active session (e.g. first visit, cleared cookies)
    client.auth.getUser()
      .then(({ data }) => setUser(data.user ?? null))
      .catch(() => setUser(null));   // silently handle no-session case

    const { data: { subscription } } = client.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  return { user, signOut };
}