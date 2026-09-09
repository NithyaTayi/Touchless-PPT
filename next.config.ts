import type { NextConfig } from "next";
import crypto from "node:crypto";
import { THEME_INIT_SCRIPT } from "./lib/theme/themeInitScript";

const isDev = process.env.NODE_ENV !== "production";

// Matches the inline <script> in app/layout.tsx exactly, so the CSP hash
// below always covers the current script — see themeInitScript.ts.
const themeScriptHash = `'sha256-${crypto.createHash("sha256").update(THEME_INIT_SCRIPT, "utf8").digest("base64")}'`;

// This app never talks to a backend: the .pptx file, camera stream and
// gesture inference all stay in the browser, and the wasm/model assets
// mediapipe needs are served from /public (same-origin). That lets the
// policy stay tight — no external script/style/connect origins to allow.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' ${themeScriptHash} 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'", // Next/Tailwind inject styles at runtime
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`, // ws: for Next dev HMR
  "worker-src 'self' blob:", // mediapipe's wasm runtime uses blob: workers
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Camera is the one permission this app actually needs.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
