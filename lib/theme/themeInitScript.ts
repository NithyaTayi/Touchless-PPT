// Single source of truth for the inline theme-init script.
//
// Runs before paint so the correct theme class is on <html> before React
// hydrates — avoids a flash of the wrong theme. Falls back to OS preference
// when no explicit choice has been saved yet.
//
// Kept in its own module (rather than inlined in app/layout.tsx) so that
// next.config.ts can hash this exact string into the Content-Security-Policy
// script-src allowlist — editing this file automatically updates the CSP
// hash, instead of a hand-maintained hash silently going stale.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.add(theme);
  } catch (e) {}
})();
`;
