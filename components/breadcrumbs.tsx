'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const labels: Record<string, { en: string; ur: string }> = {
  app: { en: 'App', ur: 'ایپ' },
  records: { en: 'Records', ur: 'ریکارڈز' },
  new: { en: 'New', ur: 'نیا' },
  notifications: { en: 'Notifications', ur: 'اطلاعات' },
  profile: { en: 'Profile', ur: 'پروفائل' },
  settings: { en: 'Settings', ur: 'ترتیبات' },
  login: { en: 'Login', ur: 'لاگ اِن' },
  admin: { en: 'Admin', ur: 'انتظامیہ' },
  users: { en: 'Users', ur: 'صارفین' }
};

function pretty(segment: string, locale: 'en' | 'ur') {
  const known = labels[segment.toLowerCase()];
  if (known) return locale === 'ur' ? known.ur : known.en;
  return decodeURIComponent(segment).replace(/[-_]/g, ' ');
}

export function Breadcrumbs({ locale }: { locale: 'en' | 'ur' }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const withoutLocale = segments[0] === 'en' || segments[0] === 'ur' ? segments.slice(1) : segments;

  const crumbs = withoutLocale.map((seg, idx) => ({
    label: pretty(seg, locale),
    href: `/${locale}/${withoutLocale.slice(0, idx + 1).join('/')}`
  }));

  return (
    <nav className="text-sm text-slate-500" aria-label={locale === 'ur' ? 'بریڈکرَمب' : 'Breadcrumb'}>
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href={`/${locale}`} className="hover:underline">{locale === 'ur' ? 'ہوم' : 'Home'}</Link>
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
