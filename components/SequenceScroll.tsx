"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  BEATS,
  BG_RGB,
  CALLOUTS,
  CALLOUT_FRAMES,
  CHAPTERS,
  DRIFT_KEYS,
  FRAME_COUNT,
  FRAME_KEYS,
  FRAME_SIZE,
  HEIGHT_CAP_KEYS,
  SECTION_VH,
  SHIFT_KEYS,
  SHIFT_KEYS_PORTRAIT,
  ZOOM_KEYS,
  sample,
  type FrameSet,
} from "@/lib/sequence";
import { FrameStore } from "./frameStore";
import StoryBeats from "./StoryBeats";

/** The source is 1280×720 upscaled to 1920; a backing store wider than this adds cost, not detail. */
const MAX_BACKING_WIDTH = 2200;

type Placement = { dx: number; dy: number; k: number };

/**
 * Draws a frame scaled to cover on landscape screens (capped on portrait so the
 * tin stays whole), then fades any frame edge that lands inside the viewport
 * into the page colour so the product floats with no visible seam.
 * Returns the placement so DOM callouts can track the product.
 */
function paint(
  ctx: CanvasRenderingContext2D,
  bmp: ImageBitmap,
  frameW: number,
  frameH: number,
  w: number,
  h: number,
  zoom: number,
  shift: number,
  drift: number,
  heightCap: number,
): Placement {
  const cover = Math.max(w / frameW, h / frameH);
  // Push in slightly while drifting so the frame keeps filling the screen.
  const scale =
    Math.min(Math.min(cover, (2.1 * w) / frameW) * zoom, (h / frameH) * heightCap) * (1 + Math.abs(drift) * 0.9);
  const dw = frameW * scale;
  const dh = frameH * scale;
  const dx = (w - dw) / 2 + drift * w;
  const dy = (h - dh) / 2 + shift * h;

  ctx.fillStyle = `rgb(${BG_RGB})`;
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, dx, dy, dw, dh);

  const fadeEdge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(${BG_RGB},1)`);
    g.addColorStop(1, `rgba(${BG_RGB},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
  };
  const fy = Math.min(dh * 0.3, Math.max(dh * 0.14, h * 0.1));
  const fx = dw * 0.09;
  if (dy > -1) fadeEdge(0, dy - 1, 0, dy + fy, dx, dy - 1, dw, fy + 1);
  if (dy + dh < h + 1) fadeEdge(0, dy + dh + 1, 0, dy + dh - fy, dx, dy + dh - fy, dw, fy + 1);
  if (dx > -1) fadeEdge(dx - 1, 0, dx + fx, 0, dx - 1, dy, fx + 1, dh);
  if (dx + dw < w + 1) fadeEdge(dx + dw + 1, 0, dx + dw - fx, 0, dx + dw - fx, dy, fx + 1, dh);

  return { dx, dy, k: dw / 1920 };
}

export default function SequenceScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const calloutRefs = useRef<(HTMLDivElement | null)[]>([]);
  const store = useRef<FrameStore | null>(null);
  const frameSet = useRef<FrameSet>(1920);
  const raf = useRef(0);
  const last = useRef({ bmp: null as ImageBitmap | null, key: "" });
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  // A light spring rounds off wheel steps so frames glide rather than tick.
  const smoothed = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.5, restDelta: 0.0001 });
  const progress = reduceMotion ? scrollYProgress : smoothed;

  const render = () => {
    raf.current = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx || !store.current) return;

    const p = progress.get();
    const index = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(sample(FRAME_KEYS, p))));
    store.current.setTarget(index);
    const bmp = store.current.get(index);
    if (!bmp) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const zoom = sample(ZOOM_KEYS, p);
    const shift = sample(w / h < 0.85 ? SHIFT_KEYS_PORTRAIT : SHIFT_KEYS, p);
    const drift = w / h > 1.15 ? sample(DRIFT_KEYS, p) : 0;
    const heightCap = sample(HEIGHT_CAP_KEYS, p);

    const key = `${w}x${h}|${zoom.toFixed(4)}|${shift.toFixed(4)}|${drift.toFixed(4)}|${heightCap.toFixed(3)}`;
    if (last.current.bmp === bmp && last.current.key === key) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.max(1, MAX_BACKING_WIDTH / w));
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const { w: fw, h: fh } = FRAME_SIZE[frameSet.current];
    const place = paint(ctx, bmp, fw, fh, w, h, zoom, shift, drift, heightCap);
    last.current = { bmp, key };

    // Callouts follow the parts they label; written straight to the DOM, no React render.
    const [f0, f1] = CALLOUT_FRAMES;
    const t = Math.min(1, Math.max(0, (index - f0) / (f1 - f0)));
    CALLOUTS.forEach((c, i) => {
      const el = calloutRefs.current[i];
      if (!el) return;
      const x = place.dx + (c.a[0] + (c.b[0] - c.a[0]) * t) * place.k;
      const y = place.dy + (c.a[1] + (c.b[1] - c.a[1]) * t) * place.k;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  };
  const renderRef = useRef(render);
  renderRef.current = render;
  const requestRender = () => {
    if (!raf.current) raf.current = requestAnimationFrame(() => renderRef.current());
  };

  useMotionValueEvent(progress, "change", requestRender);

  useEffect(() => {
    frameSet.current = window.innerWidth < 900 ? 1280 : 1920;
    const s = new FrameStore(frameSet.current, () => {
      last.current.bmp = null;
      requestRender();
    });
    store.current = s;
    s.start();

    const canvas = canvasRef.current;
    const ro = new ResizeObserver(requestRender);
    if (canvas) ro.observe(canvas);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      s.dispose();
      store.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [a, b, c, d] = BEATS.details;
  const calloutOpacity = useTransform(progress, [a + 0.01, b + 0.01, c, d], [0, 1, 1, 0]);
  const calloutLine = useTransform(progress, [a + 0.01, b + 0.02], [0, 1]);

  return (
    <section
      id="experience"
      ref={sectionRef}
      aria-label="VELO Green Spearmint product story"
      className="relative bg-void"
      style={{ height: `${SECTION_VH}vh` }}
    >
      {/* Scroll targets for the nav, placed at each beat's resting point. */}
      {CHAPTERS.map((ch) => (
        <div
          key={ch.id}
          id={ch.id}
          aria-hidden
          className="pointer-events-none absolute left-0 h-px w-px"
          style={{ top: `calc(${ch.anchor} * (${SECTION_VH}vh - 100vh))` }}
        />
      ))}

      <div className="sticky top-0 h-screen w-full overflow-hidden supports-[height:100svh]:h-[100svh]">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

        {/* Callouts for the exploded view (desktop only). */}
        <motion.ul
          style={{ opacity: calloutOpacity }}
          className="pointer-events-none absolute inset-0 hidden md:block"
          aria-label="Parts of the tin"
        >
          {CALLOUTS.map((co, i) => (
            <li
              key={co.id}
              ref={(el) => {
                calloutRefs.current[i] = el as HTMLDivElement | null;
              }}
              className="absolute left-0 top-0 will-change-transform"
            >
              <div className="flex -translate-y-1/2 items-center">
                <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-fg" />
                <motion.span style={{ scaleX: calloutLine }} className="ml-2 h-px w-14 origin-left bg-fg/50" />
                <span className="ml-3 whitespace-nowrap">
                  <span className="block text-[14px] font-semibold tracking-[-0.01em] text-fg">{co.label}</span>
                  <span className="block text-[12px] text-muted">{co.note}</span>
                </span>
              </div>
            </li>
          ))}
        </motion.ul>

        <StoryBeats progress={progress} reduceMotion={!!reduceMotion} />
      </div>
    </section>
  );
}
