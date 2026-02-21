'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function pretty(segment: string) {
  return decodeURIComponent(segment)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs({ locale }: { locale: 'en' | 'ur' }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const withoutLocale = segments[0] === 'en' || segments[0] === 'ur' ? segments.slice(1) : segments;

  const crumbs = withoutLocale.map((seg, idx) => ({
    label: pretty(seg),
    href: `/${locale}/${withoutLocale.slice(0, idx + 1).join('/')}`
  }));

  return (
    <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href={`/${locale}`} className="hover:underline">Home</Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-2">
            <span>/</span>
            <Link href={crumb.href} className="hover:underline">{crumb.label}</Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
