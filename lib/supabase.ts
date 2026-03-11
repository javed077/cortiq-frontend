"use client";

// frontend/lib/supabase.ts
// Uses @supabase/ssr — the modern replacement for auth-helpers-nextjs

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabase = createClient();

// ── useUser hook ──────────────────────────────────────────────────────────────

export function useUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const client = createClient();

    client.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const client = createClient();
    await client.auth.signOut();
    window.location.href = "/login";
  }

  return { user, signOut };
}