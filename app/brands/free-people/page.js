import { getBrandBySlug } from '@/lib/brands';
import BrandPageContent from '@/components/BrandPageContent';
import { notFound } from 'next/navigation';

const brand = getBrandBySlug('free-people');

export const metadata = brand ? {
  title: `${brand.name} Size Chart & Fit Guide — Does ${brand.name} Run True to Size?`,
  description: `${brand.name} sizing guide: ${brand.tag}. ${brand.description?.slice(0, 140)}. Find your perfect ${brand.name} size with our free tool.`,
  openGraph: {
    title: `${brand.name} Size Chart & Fit Guide`,
    description: `${brand.tag}. Find your perfect ${brand.name} size.`,
  },
} : {};

export default function Page() {
  if (!brand) notFound();
  return <BrandPageContent brand={brand} />;
}
