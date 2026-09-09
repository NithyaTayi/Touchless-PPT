"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { SlideView } from "@/components/SlideView";
import { NavControls } from "@/components/NavControls";
import { CameraToggle } from "@/components/CameraToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PermissionState } from "@/components/PermissionState";
import { GestureToast } from "@/components/GestureToast";
import { ViewfinderFrame } from "@/components/ViewfinderFrame";
import { useSlideRenderer } from "@/lib/hooks/useSlideRenderer";
import { useCamera } from "@/lib/hooks/useCamera";
import { useGestureController } from "@/lib/hooks/useGestureController";
import type { GestureEvent } from "@/lib/gesture/types";

export default function Home() {
  const { containerRef, currentIndex, total, isLoading, error, loadFile, next, prev, goTo } = useSlideRenderer();
  const [hasFile, setHasFile] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [pointer, setPointer] = useState<{ left: number; top: number } | null>(null);
  const [laserEnabled, setLaserEnabled] = useState(false);
  const [toast, setToast] = useState<{ id: number; label: string } | null>(null);
  const presentRef = useRef<HTMLDivElement>(null);
  const toastIdRef = useRef(0);

  const showToast = useCallback((label: string) => {
    setToast({ id: ++toastIdRef.current, label });
  }, []);

  const camera = useCamera();
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  // Real Fullscreen API requires a direct user gesture (a click), so only the
  // "Present" button goes through this — gesture-triggered toggling below
  // falls back to the CSS-only overlay, since browsers reject
  // requestFullscreen() calls that don't originate from trusted user input.
  const enterPresenting = useCallback(() => {
    setIsPresenting(true);
    setLaserEnabled(false);
    void presentRef.current?.requestFullscreen().catch(() => {});
  }, []);

  const exitPresenting = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    setIsPresenting(false);
    setLaserEnabled(false);
    setPointer(null);
  }, []);

  // Keeps isPresenting truthful if fullscreen is exited by means other than
  // our own exitPresenting() call (native Escape, F11, browser UI).
  useEffect(() => {
    function handleFullscreenChange() {
      if (document.fullscreenElement) return;
      setIsPresenting(false);
      setLaserEnabled(false);
      setPointer(null);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleGestureEvent = useCallback(
    (e: GestureEvent) => {
      switch (e.type) {
        case "next":
          next();
          showToast("Next");
          break;
        case "previous":
          prev();
          showToast("Previous");
          break;
        case "jump-first":
          goTo(0);
          showToast("First slide");
          break;
        case "jump-last":
          goTo(total - 1);
          showToast("Last slide");
          break;
        case "presentation-enter":
          setIsPresenting(true);
          setLaserEnabled(false);
          showToast("Presenting");
          break;
        case "presentation-exit":
          exitPresenting();
          showToast("Exited presenting");
          break;
        case "blackout-toggle":
          setIsBlackout((p) => !p);
          break;
        case "laser-toggle":
          setLaserEnabled((v) => {
            const next = !v;
            if (!next) setPointer(null);
            showToast(next ? "Laser on" : "Laser off");
            return next;
          });
          break;
        case "pointer-move": {
          if (!isPresenting || !laserEnabled) break;
          const slideRect = containerRef.current?.getBoundingClientRect();
          const stageRect = presentRef.current?.getBoundingClientRect();
          if (!slideRect || !stageRect) break;
          setPointer({
            left: slideRect.left - stageRect.left + e.xNorm * slideRect.width,
            top: slideRect.top - stageRect.top + e.yNorm * slideRect.height,
          });
          break;
        }
        case "pointer-hide":
          setPointer(null);
          break;
      }
    },
    [next, prev, goTo, total, exitPresenting, isPresenting, laserEnabled, containerRef, showToast],
  );

  useGestureController(videoEl, camera.state === "granted", handleGestureEvent);

  // Keyboard navigation always works, independent of camera/gesture state.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!hasFile) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape" && isPresenting) exitPresenting();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasFile, next, prev, isPresenting, exitPresenting]);

  return (
    <div className="flex flex-col flex-1 items-center gap-6 bg-background text-foreground px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 md:py-16">
      {!isPresenting && (
        <header className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-5">
          <div className="flex items-center gap-2.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5 text-accent"
              aria-hidden
            >
              <path d="M9 4H4V9" />
              <path d="M15 4H20V9" />
              <path d="M4 15V20H9" />
              <path d="M20 15V20H15" />
            </svg>
            <h1 className="font-display text-xl font-medium tracking-tight">
              Touchless{" "}
              <span className="rounded border border-surface-border px-1.5 py-0.5 align-middle font-mono text-[0.65rem] font-normal tracking-wide text-foreground/60">
                PPT
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {hasFile && (
              <div className="flex max-w-[220px] flex-col items-end gap-1.5 text-right">
                <ViewfinderFrame active={camera.state === "granted"}>
                  <CameraToggle state={camera.state} onToggleOn={camera.start} onToggleOff={camera.stop} />
                </ViewfinderFrame>
                <PermissionState state={camera.state} errorMessage={camera.errorMessage} />
              </div>
            )}
            <ThemeToggle />
          </div>
        </header>
      )}

      {!hasFile && (
        <div className="w-full max-w-xl">
          <UploadZone
            onFileSelected={(file) => {
              setHasFile(true);
              void loadFile(file);
            }}
          />
        </div>
      )}

      <div className={hasFile ? "contents" : "hidden"}>
        <div
          ref={presentRef}
          className={
            isPresenting
              ? "fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
              : "relative w-full max-w-4xl"
          }
          style={
            isPresenting
              ? {
                  paddingTop: "max(1rem, env(safe-area-inset-top))",
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                  paddingLeft: "max(1rem, env(safe-area-inset-left))",
                  paddingRight: "max(1rem, env(safe-area-inset-right))",
                }
              : undefined
          }
        >
          <SlideView ref={containerRef} presenting={isPresenting} />
          {isBlackout && <div className="absolute inset-0 bg-black" />}
          {isPresenting && pointer && (
            <div
              className="pointer-events-none absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/80 shadow-[0_0_12px_4px_rgba(239,68,68,0.6)]"
              style={{ left: pointer.left, top: pointer.top }}
            />
          )}
        </div>

        {!isPresenting && (
          <>
            {isLoading && <p className="text-sm text-foreground/60">Loading…</p>}
            {error && <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <NavControls currentIndex={currentIndex} total={total} onPrev={prev} onNext={next} />
              <button
                onClick={enterPresenting}
                className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Present ▶
              </button>
            </div>

            <button
              onClick={() => setHasFile(false)}
              className="text-sm text-foreground/60 underline hover:text-foreground"
            >
              Choose a different file
            </button>
          </>
        )}
      </div>

      {/* Always mounted (not conditionally rendered) so videoRef is attached
          before camera.start() resolves — avoids a mount-order race. */}
      <ViewfinderFrame
        active={camera.state === "granted"}
        className={`fixed ${camera.state === "granted" ? "block" : "hidden"}`}
        style={{
          bottom: "calc(0.5rem + env(safe-area-inset-bottom))",
          right: "calc(0.5rem + env(safe-area-inset-right))",
        }}
      >
        <video
          ref={(el) => {
            camera.attachVideo(el);
            setVideoEl(el);
          }}
          muted
          playsInline
          className="w-24 rounded-lg border border-surface-border shadow-lg [transform:scaleX(-1)] sm:w-32 md:w-40"
        />
      </ViewfinderFrame>

      <GestureToast toast={toast} />
    </div>
  );
}
