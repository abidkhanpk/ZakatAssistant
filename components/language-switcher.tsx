'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export function LanguageSwitcher({ locale }: { locale: 'en' | 'ur' }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const targetLocale = locale === 'en' ? 'ur' : 'en';

  const switchedPath = pathname.replace(/^\/(en|ur)(?=\/|$)/, `/${targetLocale}`);
  const qs = searchParams.toString();
  const href = qs ? `${switchedPath}?${qs}` : switchedPath;

  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-brand/30 hover:text-brand"
      aria-label={locale === 'en' ? 'اردو' : 'English'}
      style={{
        fontFamily:
          locale === 'en'
            ? '"Gulzar", "Noto Nastaliq Urdu", "Noto Naskh Arabic", Georgia, serif'
            : 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      {locale === 'en' ? 'اردو' : 'En'}
    </Link>
  );
}
