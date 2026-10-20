export const FRAME_COUNT = 240;

/** Two encodes of the same 240 frames: 1920w for large screens, native 1280w for phones. */
export type FrameSet = 1920 | 1280;
export const framePath = (set: FrameSet, i: number) => `/frames/${set}/${String(i + 1).padStart(4, "0")}.webp`;
export const FRAME_SIZE: Record<FrameSet, { w: number; h: number }> = {
  1920: { w: 1920, h: 1080 },
  1280: { w: 1280, h: 720 },
};

/** Total height of the pinned experience. The canvas stays sticky for (SECTION_VH - 100)vh of scroll. */
export const SECTION_VH = 500;

/** Page background, eyedropped from the sequence. Keep in sync with `void` in tailwind.config.ts. */
export const BG_RGB = "1, 1, 1";

type Ease = (t: number) => number;
type Key = { at: number; v: number; ease?: Ease };

export const easeInOut: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut: Ease = (t) => 1 - Math.pow(1 - t, 3);

/** Piecewise interpolation; a key's `ease` shapes the segment that ends at it. */
export function sample(keys: Key[], p: number): number {
  if (p <= keys[0].at) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (p <= b.at) {
      const t = (p - a.at) / (b.at - a.at || 1);
      return a.v + (b.v - a.v) * (b.ease ? b.ease(t) : t);
    }
  }
  return keys[keys.length - 1].v;
}

/**
 * Scroll progress -> frame index (0-based), for the 240-frame source clip:
 *   0   – 14  front-on hero
 *   14  – 49  spin to profile, settle at three-quarter (closed)
 *   50  – 72  lid lifts, pouches appear
 *   72  – 120 separation
 *   120 – 239 slow camera move across the exploded composition
 * The clip never closes again, so reassembly plays it back to the closed
 * three-quarter pose instead of re-running the spin.
 */
export const REST_FRAME = 49;
export const FRAME_KEYS: Key[] = [
  { at: 0, v: 0 },
  { at: 0.12, v: 12 },
  { at: 0.4, v: 74 },
  { at: 0.64, v: 122 },
  { at: 0.84, v: 205 },
  { at: 0.86, v: 205 },
  { at: 0.95, v: REST_FRAME, ease: easeInOut },
  { at: 1, v: REST_FRAME },
];

/** Product scale relative to "cover". Pulled back for the hero/CTA and for the annotated view. */
export const ZOOM_KEYS: Key[] = [
  { at: 0, v: 0.68 },
  { at: 0.16, v: 1, ease: easeOut },
  { at: 0.62, v: 1 },
  { at: 0.68, v: 0.9, ease: easeInOut },
  { at: 0.84, v: 0.9 },
  { at: 0.95, v: 0.66, ease: easeInOut },
  { at: 1, v: 0.66 },
];

/**
 * Upper bound on scale relative to viewport height (1 = frame height equals
 * viewport height). Keeps the hero/CTA tin clear of the copy on ultra-wide screens.
 */
export const HEIGHT_CAP_KEYS: Key[] = [
  { at: 0, v: 0.68 },
  { at: 0.16, v: 3, ease: easeOut },
  { at: 0.84, v: 3 },
  { at: 0.95, v: 0.66, ease: easeInOut },
  { at: 1, v: 0.66 },
];

/** Vertical offset of the product as a fraction of viewport height. */
export const SHIFT_KEYS: Key[] = [
  { at: 0, v: 0.075 },
  { at: 0.16, v: 0, ease: easeOut },
  { at: 0.86, v: 0 },
  { at: 0.95, v: 0.05, ease: easeInOut },
  { at: 1, v: 0.05 },
];

/** Portrait: copy sits under the product, so lift it clear during the story beats. */
export const SHIFT_KEYS_PORTRAIT: Key[] = [
  { at: 0, v: 0.04 },
  { at: 0.16, v: -0.12, ease: easeInOut },
  { at: 0.86, v: -0.12 },
  { at: 0.95, v: 0.03, ease: easeInOut },
  { at: 1, v: 0.03 },
];

/**
 * Horizontal camera drift (fraction of viewport width, + = right) that moves the
 * product away from whichever side the copy is on. Landscape only.
 */
export const DRIFT_KEYS: Key[] = [
  { at: 0, v: 0 },
  { at: 0.14, v: 0 },
  { at: 0.21, v: 0.1, ease: easeInOut },
  { at: 0.36, v: 0.1 },
  { at: 0.45, v: -0.1, ease: easeInOut },
  { at: 0.6, v: -0.1 },
  { at: 0.68, v: 0, ease: easeInOut },
  { at: 1, v: 0 },
];

/** Story beats: [fadeInStart, fullyIn, fadeOutStart, gone]. */
export const BEATS = {
  overview: [-1, 0, 0.07, 0.12],
  product: [0.16, 0.2, 0.34, 0.38],
  design: [0.42, 0.46, 0.58, 0.62],
  details: [0.68, 0.71, 0.81, 0.85],
  discover: [0.91, 0.95, 1, 2],
} as const;

export type ChapterId = keyof typeof BEATS;

export const CHAPTERS: { id: ChapterId; label: string; anchor: number; from: number }[] = [
  { id: "overview", label: "Overview", anchor: 0, from: 0 },
  { id: "product", label: "Product", anchor: 0.27, from: 0.14 },
  { id: "design", label: "Design", anchor: 0.52, from: 0.4 },
  { id: "details", label: "Details", anchor: 0.76, from: 0.65 },
  { id: "discover", label: "Discover", anchor: 0.98, from: 0.88 },
];

export function chapterAt(p: number): ChapterId {
  let current: ChapterId = CHAPTERS[0].id;
  for (const c of CHAPTERS) if (p >= c.from) current = c.id;
  return current;
}

/**
 * Callout anchors in 1920×1080 frame space: the right-hand rim of each part,
 * measured from pixel extents on frames 110 and 200 and interpolated between.
 */
export const CALLOUTS = [
  { id: "lid", label: "Lid", note: "Printed Green Spearmint label", a: [1374, 40], b: [1387, 40] },
  { id: "ring", label: "Inner ring", note: "Clear", a: [1346, 200], b: [1355, 200] },
  { id: "pouches", label: "Pouches", note: "White", a: [1317, 560], b: [1341, 560] },
  { id: "container", label: "Container", note: "Translucent", a: [1353, 930], b: [1368, 930] },
] as const;
export const CALLOUT_FRAMES = [110, 200] as const;
