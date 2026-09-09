"use client";

import { useEffect, useRef } from "react";
import { GestureController } from "@/lib/gesture/GestureController";
import type { GestureEvent } from "@/lib/gesture/types";

export function useGestureController(
  videoEl: HTMLVideoElement | null,
  active: boolean,
  onEvent: (e: GestureEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!active || !videoEl) return;

    const controller = new GestureController();
    const unsubscribe = controller.onEvent((e) => onEventRef.current(e));
    void controller.start(videoEl);

    return () => {
      unsubscribe();
      controller.stop();
    };
  }, [active, videoEl]);
}
