function SizeTable({ data, showHip }) {
  if (!data) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cream-300">
            <th className="py-2 px-3 text-left text-text-muted font-medium text-xs">Size</th>
            <th className="py-2 px-3 text-left text-text-muted font-medium text-xs">Bust/Chest</th>
            <th className="py-2 px-3 text-left text-text-muted font-medium text-xs">Waist</th>
            {showHip && <th className="py-2 px-3 text-left text-text-muted font-medium text-xs">Hip</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className="border-b border-cream-200">
              <td className="py-2.5 px-3 font-semibold text-blush-500 text-xs">{r.s}</td>
              <td className="py-2.5 px-3">{r.bust ? `${r.bust[0]}–${r.bust[1]}″` : ""}</td>
              <td className="py-2.5 px-3">{r.waist ? `${r.waist[0]}–${r.waist[1]}″` : ""}</td>
              {showHip && <td className="py-2.5 px-3">{r.hip ? `${r.hip[0]}–${r.hip[1]}″` : ""}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BrandPageContent({ brand }) {
  const b = brand;
  const fitColor = b.big ? 'text-amber-600 bg-amber-50' : b.small ? 'text-blue-600 bg-blue-50' : 'text-emerald-600 bg-emerald-50';
  const fitLabel = b.big ? 'Runs Big' : b.small ? 'Runs Small' : 'True to Size';

  // FAQ structured data
  const faqSchema = b.faqs?.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": b.faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  } : null;

  return (
    <div className="pt-24 pb-16 px-5 max-w-2xl mx-auto">
      {/* Structured data */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <a href="/brands" className="text-text-secondary text-sm hover:text-blush-500 transition-colors mb-6 inline-block">← All Brands</a>

      <h1 className="font-display text-4xl mb-1">{b.name} Size Chart & Fit Guide</h1>
      <p className="text-text-secondary text-sm mb-3">{b.tag}</p>
      <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6 ${fitColor}`}>{fitLabel}</span>

      {/* Description */}
      {b.description && (
        <div className="card p-5 mb-4">
          <p className="text-sm leading-relaxed text-text">{b.description}</p>
        </div>
      )}

      {/* Fit notes */}
      {b.wNote && (
        <div className="card p-5 mb-3">
          <p className="section-label mb-1.5">WOMEN'S FIT NOTES</p>
          <p className="text-sm leading-relaxed">{b.wNote}</p>
        </div>
      )}
      {b.mNote && (
        <div className="card p-5 mb-3">
          <p className="section-label mb-1.5">MEN'S FIT NOTES</p>
          <p className="text-sm leading-relaxed">{b.mNote}</p>
        </div>
      )}

      {/* Size charts */}
      {b.wTops && (
        <div className="card p-5 mb-3">
          <p className="section-label mb-3">WOMEN'S TOPS</p>
          <SizeTable data={b.wTops} showHip={false} />
        </div>
      )}
      {b.wBot && (
        <div className="card p-5 mb-3">
          <p className="section-label mb-3">WOMEN'S BOTTOMS</p>
          <SizeTable data={b.wBot} showHip={true} />
        </div>
      )}
      {b.mTops && (
        <div className="card p-5 mb-3">
          <p className="section-label mb-3">MEN'S TOPS</p>
          <SizeTable data={b.mTops} showHip={false} />
        </div>
      )}
      {b.mBot && (
        <div className="card p-5 mb-3">
          <p className="section-label mb-3">MEN'S BOTTOMS</p>
          <SizeTable data={b.mBot} showHip={true} />
        </div>
      )}

      {/* FAQs */}
      {b.faqs?.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-2xl mb-4">{b.name} Sizing FAQ</h2>
          <div className="space-y-3">
            {b.faqs.map((f, i) => (
              <details key={i} className="card group">
                <summary className="p-4 cursor-pointer font-semibold text-sm flex justify-between items-center hover:text-blush-500 transition-colors">
                  {f.q}
                  <span className="text-text-muted group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-4 pb-4 text-sm text-text-secondary leading-relaxed">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-blush-50 rounded-card p-6 text-center mt-8">
        <p className="font-display text-xl mb-3">Not sure which {b.name} size?</p>
        <a href="/tool" className="bg-blush-500 text-white px-7 py-3 rounded-full font-semibold text-sm hover:bg-blush-600 transition-colors inline-block">
          Find My Size
        </a>
      </div>
    </div>
  );
}
