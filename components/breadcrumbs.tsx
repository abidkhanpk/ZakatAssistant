'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home as HomeIcon } from 'lucide-react';

const labels: Record<string, { en: string; ur: string }> = {
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
  const searchParams = useSearchParams();
  const segments = pathname.split('/').filter(Boolean);
  const withoutLocale = segments[0] === 'en' || segments[0] === 'ur' ? segments.slice(1) : segments;
  const isAppHome = withoutLocale.length === 1 && withoutLocale[0] === 'app';
  const isAuthEntryRoute =
    withoutLocale.length === 0 ||
    (withoutLocale.length === 1 && ['login', 'signup'].includes(withoutLocale[0].toLowerCase()));
  if (isAppHome || isAuthEntryRoute) return null;

  const editYear = searchParams.get('editYear');
  const recordYear = searchParams.get('year');

  const crumbs = withoutLocale
    .map((seg, idx) => ({
      segment: seg,
      label:
        seg.toLowerCase() === 'new' && editYear
          ? editYear
          : withoutLocale[idx - 1]?.toLowerCase() === 'records' && recordYear
            ? recordYear
            : pretty(seg, locale),
      href: `/${locale}/${withoutLocale.slice(0, idx + 1).join('/')}`
    }))
    .filter((crumb) => crumb.segment.toLowerCase() !== 'app');
  const allCrumbs = [{ label: locale === 'ur' ? 'ہوم' : 'Home', href: `/${locale}`, isHome: true }, ...crumbs.map((crumb) => ({ ...crumb, isHome: false }))];

  return (
    <nav className="text-sm" aria-label={locale === 'ur' ? 'بریڈکرَمب' : 'Breadcrumb'}>
      <ol className="breadcrumbs">
        {allCrumbs.map((crumb, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === allCrumbs.length - 1;
          const wordCount = crumb.label.trim().split(/\s+/).filter(Boolean).length;
          const shouldCollapse = !isFirst && !isLast && (wordCount > 5 || crumb.label.length > 28);
          const fullWidth = Math.max(130, crumb.label.length * 10 + 42);
          const stackOrder = allCrumbs.length - idx;
          return (
            <li
              key={crumb.href}
              className={`${isFirst ? 'first' : ''} ${isLast ? 'active' : ''}`}
              style={{ ['--crumb-full' as string]: `${fullWidth}px`, zIndex: stackOrder }}
            >
              <Link
                href={crumb.href}
                className={shouldCollapse ? 'is-collapsed' : ''}
                aria-label={crumb.isHome ? (locale === 'ur' ? 'ہوم' : 'Home') : undefined}
              >
                {crumb.isHome ? (
                  <span className="crumb-home-icon" aria-hidden="true">
                    <HomeIcon size={16} strokeWidth={2} />
                  </span>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
