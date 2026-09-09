"use client";

import type { CameraState } from "@/lib/hooks/useCamera";

interface CameraToggleProps {
  state: CameraState;
  onToggleOn: () => void;
  onToggleOff: () => void;
}

export function CameraToggle({ state, onToggleOn, onToggleOff }: CameraToggleProps) {
  const isOn = state === "granted" || state === "pending";
  const isLive = state === "granted";

  return (
    <button
      onClick={isOn ? onToggleOff : onToggleOn}
      disabled={state === "pending"}
      aria-pressed={isLive}
      className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        isOn
          ? "border-accent/40 bg-accent-soft text-foreground"
          : "border-surface-border hover:bg-surface"
      }`}
    >
      <span
        aria-hidden
        className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
          isLive ? "bg-signal motion-safe:animate-pulse" : state === "pending" ? "bg-accent" : "bg-surface-border"
        }`}
      />
      <span className="font-mono text-xs tracking-tight">
        {state === "pending" ? "Starting camera…" : isLive ? "Gestures live" : "Enable camera"}
      </span>
    </button>
  );
}
