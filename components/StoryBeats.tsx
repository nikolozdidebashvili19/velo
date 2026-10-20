"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { BEATS } from "@/lib/sequence";

type Range = readonly [number, number, number, number];
type Common = { progress: MotionValue<number>; reduceMotion: boolean };

/** Fades a block in and out over a beat. Only opacity + transform, so it stays on the compositor. */
function Beat({
  progress,
  reduceMotion,
  range,
  from = { x: 0, y: 24 },
  className,
  children,
}: Common & { range: Range; from?: { x?: number; y?: number }; className?: string; children: React.ReactNode }) {
  const [a, b, c, d] = range;
  const input = [a, b, c, d];
  const dx = reduceMotion ? 0 : from.x ?? 0;
  const dy = reduceMotion ? 0 : from.y ?? 0;
  const opacity = useTransform(progress, input, [a < 0 ? 1 : 0, 1, 1, d > 1 ? 1 : 0]);
  const x = useTransform(progress, input, [dx, 0, 0, -dx * 0.5]);
  const y = useTransform(progress, input, [dy, 0, 0, -dy * 0.5]);
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
  const pointerEvents = useTransform(opacity, (o) => (o > 0.6 ? "auto" : "none"));

  return (
    <motion.div style={{ opacity, x, y, visibility, pointerEvents }} className={`will-change-transform ${className ?? ""}`}>
      {children}
    </motion.div>
  );
}

/** One word of a scroll-scrubbed sentence: dim until the reader's scroll reaches it. */
function Word({ progress, at, span, strong, children }: Omit<Common, "reduceMotion"> & { at: number; span: number; strong: boolean; children: string }) {
  const opacity = useTransform(progress, [at, at + span], [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className={strong ? "text-fg" : "text-muted"}>
      {children}{" "}
    </motion.span>
  );
}

function ScrubText({ progress, from, to, parts }: Omit<Common, "reduceMotion"> & { from: number; to: number; parts: { text: string; strong?: boolean }[] }) {
  const words = parts.flatMap((p) => p.text.split(" ").map((w) => ({ w, strong: !!p.strong })));
  const step = (to - from) / words.length;
  return (
    <p className="text-lead font-semibold">
      {words.map(({ w, strong }, i) => (
        <Word key={i} progress={progress} at={from + i * step} span={step * 2.5} strong={strong}>
          {w}
        </Word>
      ))}
    </p>
  );
}

/** A spec-style row that settles in shortly after the one above it. */
function Row({ progress, at, children }: Omit<Common, "reduceMotion"> & { at: number; children: React.ReactNode }) {
  const opacity = useTransform(progress, [at, at + 0.025], [0, 1]);
  const y = useTransform(progress, [at, at + 0.025], [10, 0]);
  return (
    <motion.li style={{ opacity, y }} className="border-t border-white/[0.14] py-4 text-[17px] leading-snug tracking-[-0.01em] text-fg/85">
      {children}
    </motion.li>
  );
}

export default function StoryBeats({ progress, reduceMotion }: Common) {
  const common = { progress, reduceMotion };
  // Mobile: copy anchors under the product. Desktop: it flanks the product.
  const side = "absolute inset-0 flex items-end px-6 pb-[8vh] md:items-center md:px-[6vw] md:pb-0";

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Overview */}
      <div className="absolute inset-x-0 top-[10vh] flex justify-center px-6 text-center">
        <Beat {...common} range={BEATS.overview} from={{ y: 0 }}>
          <h1>
            <span className="block text-[19px] font-semibold tracking-[-0.01em] text-fg/90 md:text-[24px]">VELO</span>
            <span className="mt-1 block text-hero font-semibold text-fg">Green Spearmint</span>
          </h1>
          <p className="mt-4 text-intro font-medium text-muted">Minimal design. Distinctive character.</p>
        </Beat>
      </div>
      <div className="absolute inset-x-0 bottom-[5vh] flex justify-center px-6 text-center">
        <Beat {...common} range={BEATS.overview} from={{ y: 0 }}>
          <p className="mx-auto max-w-xs text-[14px] leading-relaxed text-muted sm:max-w-none">
            Discover the details of VELO Green Spearmint through a cinematic product experience.
          </p>
        </Beat>
      </div>

      {/* Product reveal — left */}
      <div className={side}>
        <Beat {...common} range={BEATS.product} from={{ x: -32, y: 0 }} className="max-w-[34rem] md:max-w-[min(32rem,34vw)]">
          <ScrubText
            progress={progress}
            from={BEATS.product[0]}
            to={BEATS.product[2] - 0.04}
            parts={[
              { text: "Every detail, considered.", strong: true },
              { text: "Explore the distinctive packaging and carefully arranged contents of VELO Green Spearmint." },
            ]}
          />
        </Beat>
      </div>

      {/* Packaging & design — right */}
      <div className={`${side} md:justify-end`}>
        <Beat {...common} range={BEATS.design} from={{ x: 32, y: 0 }} className="w-full max-w-[30rem] md:max-w-[min(28rem,30vw)]">
          <h2 className="text-headline font-semibold text-fg">Designed down to the details.</h2>
          <p className="mt-4 text-[17px] leading-[1.47] tracking-[-0.01em] text-muted md:hidden">
            Distinctive packaging, clean geometry and carefully considered details.
          </p>
          <ul className="mt-8 hidden border-b border-white/[0.14] md:block">
            <Row progress={progress} at={BEATS.design[1] - 0.01}>Distinctive VELO Green Spearmint packaging.</Row>
            <Row progress={progress} at={BEATS.design[1] + 0.01}>Clean geometry and carefully considered details.</Row>
            <Row progress={progress} at={BEATS.design[1] + 0.03}>A closer look at the product’s design and presentation.</Row>
          </ul>
        </Beat>
      </div>

      {/* Exploded view — left, with callouts drawn over the product */}
      <div className={side}>
        <Beat {...common} range={BEATS.details} from={{ x: -32, y: 0 }} className="max-w-[30rem] md:max-w-[min(20rem,24vw)]">
          <h2 className="text-headline font-semibold text-fg">A closer look at VELO.</h2>
          <p className="mt-5 text-[17px] leading-[1.47] tracking-[-0.01em] text-muted">
            <span className="text-fg">Explore the tin from every angle.</span> From the outer packaging to the
            arrangement inside — texture, contrast and precision.
          </p>
        </Beat>
      </div>

      {/* Reassembly & CTA */}
      <div className="absolute inset-x-0 top-[10vh] flex justify-center px-6 text-center">
        <Beat {...common} range={BEATS.discover}>
          <h2 className="text-hero font-semibold text-fg">VELO Green Spearmint.</h2>
          <p className="mt-4 text-intro font-medium text-muted">Explore the product. Discover every detail.</p>
        </Beat>
      </div>
      <div className="absolute inset-x-0 bottom-[6vh] flex justify-center px-6 text-center">
        <Beat {...common} range={BEATS.discover} from={{ y: 16 }}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
            <a href="#product-info" className="btn-pill">
              Explore VELO
            </a>
            <a href="#product-info" className="link-more">
              View product details
              <span aria-hidden className="text-[20px] leading-none">›</span>
            </a>
          </div>
          <p className="mt-6 text-[12px] text-subtle">Product information and applicable age restrictions.</p>
        </Beat>
      </div>
    </div>
  );
}
