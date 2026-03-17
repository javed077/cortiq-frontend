import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // ── Fix: Turbopack root warning ───────────────────────────────────────────
  // Multiple lockfiles detected (root + frontend/).
  // Tell Turbopack the actual workspace root so it stops guessing.

  // ── Fix: middleware → proxy rename (Next.js 15+) ─────────────────────────
  // The file is still called middleware.ts but Next.js 16 shows a deprecation
  // warning. Setting this suppresses it while keeping backward compatibility.
  // You can rename the file to proxy.ts later and remove this line.
  // See: https://nextjs.org/docs/messages/middleware-to-proxy

  // ── Other sensible defaults ───────────────────────────────────────────────
  reactStrictMode: true,

  // If your API is on a different origin during dev, proxy it here so you
  // don't need to set NEXT_PUBLIC_API_URL in .env.local
  async rewrites() {
    return process.env.NEXT_PUBLIC_API_URL
      ? [] // already set — no rewrite needed
      : [
          {
            source: "/api/backend/:path*",
            destination: "http://127.0.0.1:8000/:path*",
          },
        ];
  },
};

export default nextConfig;