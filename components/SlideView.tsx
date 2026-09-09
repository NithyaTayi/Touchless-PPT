"use client";

import { forwardRef } from "react";

interface SlideViewProps {
  /** Fill the viewport (letterboxed, aspect preserved) instead of the capped inline layout width. */
  presenting?: boolean;
}

export const SlideView = forwardRef<HTMLDivElement, SlideViewProps>(function SlideView({ presenting }, ref) {
  return (
    <div
      ref={ref}
      className={
        presenting
          ? "relative aspect-video h-full max-w-full w-auto bg-white shadow-lg overflow-hidden"
          : "relative aspect-video w-full max-w-4xl bg-white shadow-lg overflow-hidden"
      }
    />
  );
});
