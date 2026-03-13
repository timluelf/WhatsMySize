import { BRAND_SLUGS } from '@/lib/brands';

const BASE_URL = 'https://whatsmysize.ai';

export default function sitemap() {
  const brandPages = BRAND_SLUGS.map(slug => ({
    url: `${BASE_URL}/brands/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/brands`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tool`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...brandPages,
  ];
}
