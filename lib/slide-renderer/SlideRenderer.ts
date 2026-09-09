export interface SlideRenderer {
  attach(container: HTMLElement): void;
  loadFile(fileOrArrayBuffer: File | ArrayBuffer): Promise<void>;
  next(): void;
  prev(): void;
  goTo(index: number): void;
  getSlideCount(): number;
  getCurrentIndex(): number;
  getSlideBounds(): DOMRect | null;
  onSlideChange(listener: (index: number, total: number) => void): () => void;
  destroy(): void;
}
