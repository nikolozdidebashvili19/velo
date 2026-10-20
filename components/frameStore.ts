import { FRAME_COUNT, framePath, type FrameSet } from "@/lib/sequence";

/**
 * Keeps every frame as a compressed Blob (~45 KB each) but only a small window
 * of decoded full-resolution ImageBitmaps around the playhead. Decoding happens
 * off the main thread via createImageBitmap, so scrubbing never stalls on a
 * synchronous decode, and memory stays bounded (holding all 240 decoded 1080p
 * frames would be ~2 GB, which is what makes naive image sequences stutter).
 *
 * Every 8th frame is also kept as a small, permanent "anchor" so a fast scrub
 * always has something close to show while the exact frame decodes.
 */
export class FrameStore {
  private blobs: (Blob | null)[] = new Array(FRAME_COUNT).fill(null);
  private full = new Map<number, ImageBitmap>();
  private anchors = new Map<number, ImageBitmap>();
  private pending = new Set<string>();
  private inflight = 0;
  private target = 0;
  private direction = 1;
  private disposed = false;

  constructor(
    private readonly set: FrameSet,
    private readonly onReady: () => void,
    private readonly windowSize = 36,
    private readonly anchorWidth = 640,
  ) {}

  start() {
    const queue = loadOrder(FRAME_COUNT);
    const fetchNext = async (): Promise<void> => {
      const i = queue.shift();
      if (i === undefined || this.disposed) return;
      try {
        const res = await fetch(framePath(this.set, i));
        if (res.ok) {
          this.blobs[i] = await res.blob();
          if (this.disposed) return;
          if (i % 8 === 0) this.decode(i, "anchor");
          this.pump();
        }
      } catch {
        // A missing frame falls back to its nearest neighbour.
      }
      return fetchNext();
    };
    for (let k = 0; k < 6; k++) fetchNext();
  }

  dispose() {
    this.disposed = true;
    this.full.forEach((b) => b.close());
    this.anchors.forEach((b) => b.close());
    this.full.clear();
    this.anchors.clear();
  }

  /** Tell the store where the playhead is so it decodes ahead in the scroll direction. */
  setTarget(i: number) {
    if (i !== this.target) this.direction = i > this.target ? 1 : -1;
    this.target = i;
    this.pump();
  }

  /** Best available bitmap for frame i: exact, a close full-res neighbour, an anchor, then anything. */
  get(i: number): ImageBitmap | null {
    const exact = this.full.get(i);
    if (exact) return exact;
    for (let d = 1; d <= 3; d++) {
      const near = this.full.get(i - d * this.direction) ?? this.full.get(i + d * this.direction);
      if (near) return near;
    }
    const anchor = nearest(this.anchors, i);
    const sharp = nearest(this.full, i);
    // A sharp frame wins ties; otherwise the closer frame keeps motion believable.
    return (sharp.d <= anchor.d ? sharp.bmp : anchor.bmp) ?? sharp.bmp;
  }

  private wanted(): number[] {
    const t = this.target;
    const d = this.direction;
    const list = [t];
    for (let k = 1; k <= 8; k++) list.push(t + k * d);
    for (let k = 1; k <= 3; k++) list.push(t - k * d);
    return list.filter((i) => i >= 0 && i < FRAME_COUNT);
  }

  private pump() {
    if (this.disposed) return;
    for (const i of this.wanted()) {
      if (this.inflight >= 3) return;
      if (!this.blobs[i] || this.full.has(i) || this.pending.has(`f${i}`)) continue;
      this.decode(i, "full");
    }
  }

  private async decode(i: number, kind: "full" | "anchor") {
    const blob = this.blobs[i];
    const key = `${kind[0]}${i}`;
    if (!blob || this.pending.has(key)) return;
    this.pending.add(key);
    if (kind === "full") this.inflight++;
    let bmp: ImageBitmap | null = null;
    try {
      bmp =
        kind === "anchor"
          ? await createImageBitmap(blob, { resizeWidth: this.anchorWidth, resizeQuality: "medium" }).catch(() =>
              createImageBitmap(blob),
            )
          : await createImageBitmap(blob);
    } catch {
      bmp = null;
    }
    this.pending.delete(key);
    if (kind === "full") this.inflight--;
    if (!bmp) return;
    if (this.disposed) {
      bmp.close();
      return;
    }

    if (kind === "anchor") {
      this.anchors.set(i, bmp);
    } else {
      this.full.set(i, bmp);
      this.evict();
    }
    if (Math.abs(i - this.target) <= 8 || this.full.size + this.anchors.size <= 2) this.onReady();
    this.pump();
  }

  private evict() {
    if (this.full.size <= this.windowSize) return;
    const byDistance = Array.from(this.full.keys()).sort(
      (a, b) => Math.abs(b - this.target) - Math.abs(a - this.target),
    );
    for (const k of byDistance.slice(0, this.full.size - this.windowSize)) {
      this.full.get(k)?.close();
      this.full.delete(k);
    }
  }
}

function nearest(map: Map<number, ImageBitmap>, i: number) {
  let bmp: ImageBitmap | null = null;
  let d = Infinity;
  map.forEach((b, k) => {
    const dk = Math.abs(k - i);
    if (dk < d) {
      d = dk;
      bmp = b;
    }
  });
  return { bmp: bmp as ImageBitmap | null, d };
}

/** First frame, then every 16th, 8th, ... so the whole timeline is coarsely covered early. */
function loadOrder(count: number): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const step of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  return order;
}
