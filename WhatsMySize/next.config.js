/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Static export for easy hosting (Vercel, Netlify, etc.)
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
