const SPECS = [
  { label: "Flavour", value: "Green Spearmint", note: "Named on the lid in VELO’s signature green." },
  { label: "Format", value: "Nicotine pouches", note: "White pouches, held in a round tin that opens and closes again." },
  { label: "Packaging", value: "Lid, inner ring and container", note: "A printed lid, a clear inner ring and a translucent base." },
  {
    label: "Age",
    value: "Adults of legal age only",
    note: "Read the on-pack information and check the age restrictions that apply where you live.",
  },
];

export default function ProductDetails() {
  return (
    <section
      id="product-info"
      aria-labelledby="product-info-title"
      className="scroll-mt-[52px] bg-void px-6 pb-28 pt-28 md:pb-40 md:pt-40"
    >
      <div className="mx-auto max-w-[980px]">
        <h2 id="product-info-title" className="text-headline font-semibold text-fg">
          Product details
        </h2>

        <dl className="mt-12 border-b border-white/[0.14] md:mt-16">
          {SPECS.map((s) => (
            <div key={s.label} className="grid gap-2 border-t border-white/[0.14] py-7 md:grid-cols-[220px_1fr] md:gap-8 md:py-9">
              <dt className="text-[17px] font-semibold tracking-[-0.01em] text-muted">{s.label}</dt>
              <dd>
                <p className="text-[21px] font-semibold tracking-[-0.015em] text-fg md:text-[24px]">{s.value}</p>
                <p className="mt-2 max-w-[38rem] text-[17px] leading-[1.47] tracking-[-0.01em] text-muted">{s.note}</p>
              </dd>
            </div>
          ))}
        </dl>

        <p role="note" className="mt-16 border border-white/25 px-6 py-5 text-center text-[15px] font-semibold uppercase tracking-[0.02em] text-fg md:text-[17px]">
          Warning: This product contains nicotine. Nicotine is an addictive chemical.
        </p>
      </div>
    </section>
  );
}
