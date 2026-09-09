"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SlideRenderer } from "@/lib/slide-renderer/SlideRenderer";
import { PptxViewJsAdapter } from "@/lib/slide-renderer/PptxViewJsAdapter";

export function useSlideRenderer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<SlideRenderer | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  const loadFile = useCallback(async (file: File) => {
    if (!containerRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      rendererRef.current?.destroy();
      const renderer = new PptxViewJsAdapter();
      rendererRef.current = renderer;
      renderer.attach(containerRef.current);
      renderer.onSlideChange((index, slideTotal) => {
        setCurrentIndex(index);
        setTotal(slideTotal);
      });
      await renderer.loadFile(file);
      setCurrentIndex(renderer.getCurrentIndex());
      setTotal(renderer.getSlideCount());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const next = useCallback(() => rendererRef.current?.next(), []);
  const prev = useCallback(() => rendererRef.current?.prev(), []);
  const goTo = useCallback((index: number) => rendererRef.current?.goTo(index), []);
  const getSlideBounds = useCallback(() => rendererRef.current?.getSlideBounds() ?? null, []);

  return { containerRef, currentIndex, total, isLoading, error, loadFile, next, prev, goTo, getSlideBounds };
}
