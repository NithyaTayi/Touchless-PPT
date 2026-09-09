// Single source of truth for the inline theme-init script.
//
// Runs before paint so the correct theme class is on <html> before React
// hydrates — avoids a flash of the wrong theme. Falls back to OS preference
// when no explicit choice has been saved yet.
//
// Kept in its own module (rather than inlined in app/layout.tsx) as a
// single source of truth, in case it's ever reused elsewhere.
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
