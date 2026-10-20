import { CHAPTERS } from "@/lib/sequence";

export default function Footer() {
  return (
    <footer className="bg-ink px-6 py-8 text-[12px] text-muted">
      <div className="mx-auto max-w-[980px]">
        <p className="border-b border-white/[0.1] pb-4 leading-relaxed">
          VELO Green Spearmint is a nicotine product, intended for adults of legal age only. Not for sale to minors.
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span>VELO Green Spearmint</span>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            {CHAPTERS.map((c) => (
              <a key={c.id} href={`#${c.id}`} className="text-fg/70 transition-colors hover:text-fg">
                {c.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
