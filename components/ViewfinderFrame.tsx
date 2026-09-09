"use client";

import type { CSSProperties, ReactNode } from "react";

interface ViewfinderFrameProps {
  /** Whether the thing being framed is actively "seen" right now. */
  active: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const CORNERS = [
  "-top-1.5 -left-1.5 border-t-2 border-l-2",
  "-top-1.5 -right-1.5 border-t-2 border-r-2",
  "-bottom-1.5 -left-1.5 border-b-2 border-l-2",
  "-bottom-1.5 -right-1.5 border-b-2 border-r-2",
];

/** Camera-reticle corner brackets, the app's one recurring visual signature:
 * it frames whatever is currently being watched by the gesture camera. */
const POSITION_CLASS_RE = /\b(?:static|fixed|absolute|relative|sticky)\b/;

export function ViewfinderFrame({ active, className = "", style, children }: ViewfinderFrameProps) {
  const positionClass = POSITION_CLASS_RE.test(className) ? "" : "relative";
  return (
    <div className={`${positionClass} ${className}`} style={style}>
      {children}
      {CORNERS.map((corner) => (
        <span
          key={corner}
          aria-hidden
          className={`pointer-events-none absolute h-3 w-3 border-accent transition-opacity duration-300 motion-reduce:transition-none ${corner} ${
            active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
