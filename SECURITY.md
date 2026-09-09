# Security

## Review — 2026-09-09

Ran via the `/check_security_issues` custom command → tried the `/security-review` skill first.
That skill diffs against `origin/HEAD`, but this repo has **no remote configured** (still just the
single `Initial commit from Create Next App`), so its auto-diff step fails outright with an
"unknown revision" error. Worked around it by reviewing `git diff HEAD` (all uncommitted tracked
changes) plus every untracked file by hand instead. **Next time:** either add a remote before
running `/security-review`, or expect to do this manual pass again.

**Scope:** everything since the initial commit — all of the camera/gesture/pptx-render code and
theming, i.e. all of `components/`, `lib/`, `public/models/`, `public/wasm/`, plus the
`app/page.tsx`/`app/layout.tsx`/`app/globals.css` diffs.

**Result: no exploitable vulnerabilities found.**

- No XSS path: only one `dangerouslySetInnerHTML` in the whole codebase (the theme-init script in
  `app/layout.tsx`), and it's a static string, never interpolated with user/file data. The pptx
  itself is rendered by `pptxviewjs` onto a `<canvas>`, never injected as HTML.
- No secrets committed; `.gitignore` already excludes `.env*`.
- `npm audit` on the newly-added deps (`@mediapipe/tasks-vision`, `chart.js`, `jszip`,
  `pptxviewjs`) → 0 vulnerabilities.
- App is 100% client-side (no `app/api/*` routes exist yet), which removes most classic
  server-side attack surface (no SQLi/SSRF/auth-bypass paths possible today). **Revisit this
  review once OneDrive/Teams server routes are added** (see `HANDOFF.md`'s "Not started yet") —
  a fresh server-side surface will exist then that this pass didn't need to cover.
- One **non-security** note, not fixed, just flagged for awareness: `pptxviewjs` is a
  low-adoption npm package and is the trust boundary for untrusted `.pptx` files people upload.
  Nothing actionable now — just a maintenance risk worth remembering if it ever stops being
  updated.

## Hardening added — 2026-09-09 (proactive, not a fix for a found bug)

User asked to "fix the issues found" after the review above; since nothing exploitable was found,
agreed with the user instead to add defense-in-depth CSP/security headers — optional hardening,
not a patch for a real vulnerability.

- **`next.config.ts`** now sets response headers via `headers()`:
  - `Content-Security-Policy`: `default-src 'self'`; `script-src` allows only `'self'` + the
    **exact sha256 hash** of the one inline `<script>` (theme-init) — no blanket `'unsafe-inline'`
    — plus `'wasm-unsafe-eval'` for MediaPipe's WASM runtime and `worker-src ... blob:` for its
    workers. No external origins allowed anywhere (nothing in this app needs one).
  - Also sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
    `Referrer-Policy: strict-origin-when-cross-origin`, and
    `Permissions-Policy: camera=(self), microphone=(), geolocation=()` (camera is the only
    permission the app actually uses).
  - Dev mode (`NODE_ENV !== "production"`) loosens `script-src` with `'unsafe-eval'` and adds
    `ws:` to `connect-src` — required for Turbopack/HMR, not present in production builds.
- **`lib/theme/themeInitScript.ts`** (new): the inline theme-flash-prevention script that used to
  live directly in `app/layout.tsx` was extracted here as a single exported string constant.
  Reason: `next.config.ts` imports this same constant and hashes it at config-load time to build
  the CSP `script-src` value — so editing the script automatically keeps the CSP hash in sync,
  instead of a hand-maintained hash going stale the next time someone touches the script.
- **Verified:** `npx tsc --noEmit` clean; `curl -D -` against the dev server confirms all headers
  present with the correct hash; loaded the app in a real Chrome tab via claude-in-chrome — no
  CSP violations in the console, theme class applies correctly, layout/styling unaffected.

## If you change the theme-init script

Edit `lib/theme/themeInitScript.ts` only — do not re-inline the script back into
`app/layout.tsx`. `next.config.ts` hashes that file's exported string at config-load time to
build the CSP `script-src` allowlist, so editing it there keeps the hash correct automatically.
