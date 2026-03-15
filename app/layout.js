import './globals.css';
import Nav from '@/components/Nav';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: {
    default: 'What\'s My Size — Know Your Size, Everywhere',
    template: '%s | What\'s My Size',
  },
  description: 'Find your perfect clothing size across 25+ brands. Enter your measurements once and get accurate size predictions for Nike, Lululemon, Zara, H&M, and more.',
  keywords: ['clothing size calculator', 'size chart', 'what size am I', 'brand sizing', 'fit predictor'],
  openGraph: {
    title: 'What\'s My Size — Know Your Size, Everywhere',
    description: 'Find your perfect clothing size across 25+ brands.',
    url: 'https://fitpassport.co',
    siteName: 'FitPassport',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What\'s My Size — Know Your Size, Everywhere',
    description: 'Find your perfect clothing size across 25+ brands.',
  },
  robots: { index: true, follow: true },
  verification: {
    google: ['eydrxH3uR4tFWN87L9F2P-DyvsG8nzGIQ-SuvGWzr7s', 'CLhTS130VG7a5rGcs5L15TjFMST4rnAXON9YsG4X6QI'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-cream-100 text-text font-body min-h-screen">
        <Nav />

        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t border-cream-300 py-8 px-5">
          <div className="max-w-4xl mx-auto text-center text-xs text-text-muted">
            <p className="mb-2">whatsmysize — data-driven sizing across 25+ brands</p>
            <div className="flex gap-4 justify-center">
              <a href="/brands" className="hover:text-blush-500 transition-colors">All Brands</a>
              <a href="/tool" className="hover:text-blush-500 transition-colors">Size Tool</a>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
