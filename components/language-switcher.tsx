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
      className="rounded-full border bg-white/90 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur"
      aria-label={locale === 'en' ? 'Switch language to Urdu' : 'Switch language to English'}
    >
      {locale === 'en' ? 'اردو' : 'EN'}
    </Link>
  );
}
