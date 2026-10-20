"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { CHAPTERS, chapterAt, type ChapterId } from "@/lib/sequence";

/** Modelled on Apple's product-page local nav: name left, quiet links and a small pill right. */
export default function Navbar() {
  const { scrollY } = useScroll();
  const glass = useTransform(scrollY, [8, 80], [0, 1]);
  const [active, setActive] = useState<ChapterId | null>("overview");
  const section = useRef({ top: 0, span: 1 });

  useEffect(() => {
    const measure = () => {
      const el = document.getElementById("experience");
      if (!el) return;
      section.current = { top: el.offsetTop, span: Math.max(1, el.offsetHeight - window.innerHeight) };
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useMotionValueEvent(scrollY, "change", (y) => {
    const { top, span } = section.current;
    const p = (y - top) / span;
    const next = p > 1.02 ? null : chapterAt(Math.max(0, p));
    setActive((cur) => (cur === next ? cur : next));
  });

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        aria-hidden
        style={{ opacity: glass }}
        className="absolute inset-0 border-b border-white/[0.08] bg-[rgba(1,1,1,0.72)] backdrop-blur-xl backdrop-saturate-[1.8]"
      />
      <nav aria-label="Primary" className="relative mx-auto flex h-[52px] max-w-[1024px] items-center justify-between px-5 lg:px-0">
        <a href="#overview" className="text-[19px] font-semibold tracking-[-0.02em] text-fg md:text-[21px]">
          VELO <span className="font-medium">Green Spearmint</span>
        </a>

        <div className="flex items-center gap-6">
          <ul className="hidden items-center gap-6 md:flex">
            {CHAPTERS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  aria-current={active === c.id ? "true" : undefined}
                  className={`text-[12px] tracking-[-0.01em] transition-colors duration-200 hover:text-fg ${
                    active === c.id ? "text-fg" : "text-fg/60"
                  }`}
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#discover"
            className="inline-flex h-7 items-center rounded-full bg-spearmint px-3 text-[12px] font-medium text-[#03140E] transition-colors duration-300 hover:bg-mint"
          >
            Explore
          </a>
        </div>
      </nav>
    </header>
  );
}
