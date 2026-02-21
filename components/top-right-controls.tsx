import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { UserMenu } from '@/components/user-menu';

type TopRightControlsProps = {
  locale: 'en' | 'ur';
  user: { name: string; username: string; role: 'USER' | 'ADMIN' } | null;
};

export function TopRightControls({ locale, user }: TopRightControlsProps) {
  return (
    <div className="fixed right-3 top-3 z-50 flex items-center gap-2">
      {user?.role === 'ADMIN' ? (
        <Link
          href={`/${locale}/admin`}
          className="flex h-8 w-8 items-center justify-center rounded-full border bg-white/90 text-sm shadow-sm"
          aria-label="Admin"
          title="Admin"
        >
          ⚙
        </Link>
      ) : null}
      {user ? <UserMenu locale={locale} user={user} /> : null}
      <LanguageSwitcher locale={locale} />
    </div>
  );
}
