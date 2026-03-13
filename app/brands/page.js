import { BRAND_LIST, CATEGORIES } from '@/lib/brands';

export const metadata = {
  title: 'All Brands — Size Charts & Fit Guide',
  description: 'Browse sizing data and fit guides for 25+ brands including Nike, Lululemon, Zara, H&M, Adidas, and more. Find out which brands run small, big, or true to size.',
};

export default function BrandsPage() {
  return (
    <div className="pt-24 pb-16 px-5 max-w-2xl mx-auto">
      <h1 className="font-display text-4xl mb-2">All Brands</h1>
      <p className="text-text-secondary text-sm mb-8">{BRAND_LIST.length} brands with full sizing data</p>

      {Object.entries(CATEGORIES).map(([key, label]) => {
        const brands = BRAND_LIST.filter(b => b.cat === key);
        if (!brands.length) return null;
        return (
          <div key={key} className="mb-8">
            <p className="section-label mb-3">{label}</p>
            <div className="grid gap-2">
              {brands.map(b => {
                const fitColor = b.big ? 'text-amber-600 bg-amber-50' : b.small ? 'text-blue-600 bg-blue-50' : 'text-emerald-600 bg-emerald-50';
                const fitLabel = b.big ? 'Runs Big' : b.small ? 'Runs Small' : 'TTS';
                const hasM = !!b.mTops, hasW = !!b.wTops;
                return (
                  <a
                    key={b.slug}
                    href={`/brands/${b.slug}`}
                    className="card p-4 flex justify-between items-center hover:border-blush-300 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-[15px]">{b.name}</span>
                      <div className="flex gap-1.5 mt-1">
                        {hasM && <span className="text-[10px] text-text-muted bg-cream-200 px-1.5 py-0.5 rounded">Men</span>}
                        {hasW && <span className="text-[10px] text-text-muted bg-cream-200 px-1.5 py-0.5 rounded">Women</span>}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${fitColor}`}>{fitLabel}</span>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
