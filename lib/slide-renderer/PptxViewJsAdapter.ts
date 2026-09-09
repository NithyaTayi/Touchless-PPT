import type { SlideRenderer } from "./SlideRenderer";

export class PptxViewJsAdapter implements SlideRenderer {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private viewer: import("pptxviewjs").PPTXViewer | null = null;
  private listeners = new Set<(index: number, total: number) => void>();
  private resizeObserver: ResizeObserver | null = null;

  attach(container: HTMLElement): void {
    container.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.style.background = "#fff";
    container.appendChild(canvas);
    this.container = container;
    this.canvas = canvas;
    this.sizeCanvasToContainer();

    this.resizeObserver = new ResizeObserver(() => {
      if (this.sizeCanvasToContainer()) {
        void this.viewer?.render();
      }
    });
    this.resizeObserver.observe(container);
  }

  /** Sizes the canvas in real CSS pixels (not "100%") — pptxviewjs's internal
   * layout does `parseFloat(canvas.style.width)`, so a percentage string is
   * silently misread as a tiny absolute pixel value. Returns true if the size changed. */
  private sizeCanvasToContainer(): boolean {
    if (!this.container || !this.canvas) return false;
    const { width, height } = this.container.getBoundingClientRect();
    if (width <= 0 || height <= 0) return false;
    const w = `${Math.round(width)}px`;
    const h = `${Math.round(height)}px`;
    if (this.canvas.style.width === w && this.canvas.style.height === h) return false;
    this.canvas.style.width = w;
    this.canvas.style.height = h;
    return true;
  }

  async loadFile(fileOrArrayBuffer: File | ArrayBuffer): Promise<void> {
    if (!this.canvas) {
      throw new Error("PptxViewJsAdapter: attach() must be called before loadFile()");
    }
    const { PPTXViewer } = await import("pptxviewjs");

    this.viewer?.destroy();
    this.viewer = new PPTXViewer({ canvas: this.canvas });
    this.viewer.on("slideChanged", (index: unknown) => {
      const total = this.viewer?.getSlideCount() ?? 0;
      this.listeners.forEach((l) => l(index as number, total));
    });

    await this.viewer.loadFile(fileOrArrayBuffer);
    await this.viewer.render();

    const total = this.viewer.getSlideCount();
    this.listeners.forEach((l) => l(this.viewer!.getCurrentSlideIndex(), total));
  }

  next(): void {
    void this.viewer?.nextSlide();
  }

  prev(): void {
    void this.viewer?.previousSlide();
  }

  goTo(index: number): void {
    void this.viewer?.goToSlide(index);
  }

  getSlideCount(): number {
    return this.viewer?.getSlideCount() ?? 0;
  }

  getCurrentIndex(): number {
    return this.viewer?.getCurrentSlideIndex() ?? 0;
  }

  getSlideBounds(): DOMRect | null {
    return this.canvas?.getBoundingClientRect() ?? null;
  }

  onSlideChange(listener: (index: number, total: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.viewer?.destroy();
    this.viewer = null;
    this.canvas = null;
    this.container = null;
    this.listeners.clear();
  }
}
