"use client";

interface GestureToastProps {
  toast: { id: number; label: string } | null;
}

/** Confirms a recognized gesture landed. Re-keyed per event so the fade
 * animation restarts even when the same label fires twice in a row. */
export function GestureToast({ toast }: GestureToastProps) {
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      className="pointer-events-none fixed left-1/2 z-[60] rounded-full bg-black/75 px-4 py-1.5 text-sm font-medium text-white [animation:gesture-toast_900ms_ease-out_forwards]"
      style={{ bottom: "calc(2rem + env(safe-area-inset-bottom))" }}
    >
      {toast.label}
    </div>
  );
}
