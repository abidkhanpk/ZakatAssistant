import { LanguageSwitcher } from '@/components/language-switcher';
import { UserMenu } from '@/components/user-menu';
import { NotificationMenu } from '@/components/notification-menu';
import { cookies } from 'next/headers';

type TopRightControlsProps = {
  locale: 'en' | 'ur';
  user: { name: string; username: string; role: 'USER' | 'ADMIN' } | null;
  notifications: { id: string; titleEn: string; titleUr: string }[];
  unreadCount: number;
};

export function TopRightControls({ locale, user, notifications, unreadCount }: TopRightControlsProps) {
  const csrfToken = cookies().get('csrf_token')?.value || '';
  const isUr = locale === 'ur';

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <p className="text-sm font-semibold text-slate-800">{isUr ? 'زکوٰۃ اسسٹنٹ' : 'Zakat Assistant'}</p>
        <div className="flex items-center gap-2">
          {user ? <NotificationMenu locale={locale} notifications={notifications} unreadCount={unreadCount} /> : null}
          {user ? <UserMenu locale={locale} user={user} csrfToken={csrfToken} /> : null}
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
    </header>
  );
}
