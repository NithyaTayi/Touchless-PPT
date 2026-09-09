"use client";

interface NavControlsProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function NavControls({ currentIndex, total, onPrev, onNext }: NavControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onPrev}
        disabled={currentIndex <= 0}
        className="rounded-full border border-surface-border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        ← Prev
      </button>
      <span className="font-mono text-sm tabular-nums text-foreground/60">
        {total > 0 ? `${currentIndex + 1} / ${total}` : "—"}
      </span>
      <button
        onClick={onNext}
        disabled={total === 0 || currentIndex >= total - 1}
        className="rounded-full border border-surface-border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Next →
      </button>
    </div>
  );
}
