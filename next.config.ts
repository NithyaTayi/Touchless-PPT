import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// This app never talks to a backend: the .pptx file, camera stream and
// gesture inference all stay in the browser, and the wasm/model assets
// mediapipe needs are served from /public (same-origin). That lets the
// policy stay tight — no external script/style/connect origins to allow.
//
// script-src allows 'unsafe-inline' rather than pinning a sha256 hash:
// Next.js's App Router (16.3.3) unconditionally injects its own inline
// bootstrap/RSC-streaming <script> tags (e.g. id="_R_", __next_f.push(...))
// whose content embeds build-specific chunk paths and changes on every
// compile — in dev AND in static-prerendered production builds — so no
// fixed hash allowlist can cover them. See the "Without Nonces" section of
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
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
