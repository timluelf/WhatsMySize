import { BRAND_LIST, CATEGORIES } from '@/lib/brands';

export default function HomePage() {
  const brandCount = BRAND_LIST.length;

  return (
    <>
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <p className="text-sm text-blush-500 font-semibold tracking-widest uppercase mb-4">
          {brandCount} brands · Men & Women
        </p>
        <h1 className="font-display text-5xl sm:text-7xl leading-[1.05] tracking-tight max-w-xl mb-5">
          Know your size,<br />
          <em className="italic text-blush-500">everywhere.</em>
        </h1>
        <p className="text-base text-text-secondary max-w-md leading-relaxed mb-9">
          Tell us what you wear or your measurements. We'll find your perfect size across every major brand.
        </p>
        <a
          href="/tool"
          className="bg-blush-500 text-white px-10 py-4 rounded-full font-semibold text-base hover:bg-blush-600 transition-colors inline-flex items-center gap-2"
        >
          Find My Size <span className="text-lg">→</span>
        </a>

        {/* Stats */}
        <div className="flex gap-10 mt-12 flex-wrap justify-center">
          {[
            { v: "30-40%", l: "of returns are wrong size" },
            { v: "20 sec", l: "to build your profile" },
            { v: `${brandCount}+`, l: "brands covered" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <strong className="text-2xl text-blush-500 block font-bold">{s.v}</strong>
              <span className="text-xs text-text-muted">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Brand categories */}
      <section className="px-6 pb-16 max-w-2xl mx-auto">
        <h2 className="font-display text-3xl mb-6 text-center">Brands we cover</h2>
        {Object.entries(CATEGORIES).map(([key, label]) => {
          const brands = BRAND_LIST.filter(b => b.cat === key);
          if (!brands.length) return null;
          return (
            <div key={key} className="mb-6">
              <p className="section-label mb-2">{label}</p>
              <div className="flex gap-2 flex-wrap">
                {brands.map(b => (
                  <a
                    key={b.slug}
                    href={`/brands/${b.slug}`}
                    className="bg-white border border-cream-300 rounded-full px-4 py-1.5 text-sm font-medium text-text hover:border-blush-300 hover:text-blush-500 transition-colors"
                  >
                    {b.name}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
