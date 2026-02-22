import { LanguageSwitcher } from '@/components/language-switcher';
import { UserMenu } from '@/components/user-menu';
import { NotificationMenu } from '@/components/notification-menu';

type TopRightControlsProps = {
  locale: 'en' | 'ur';
  user: { name: string; username: string; role: 'USER' | 'ADMIN' } | null;
  notifications: { id: string; titleEn: string; titleUr: string }[];
  unreadCount: number;
};

export function TopRightControls({ locale, user, notifications, unreadCount }: TopRightControlsProps) {
  return (
    <div className="fixed right-3 top-3 z-50 flex items-center gap-2">
      {user ? <NotificationMenu locale={locale} notifications={notifications} unreadCount={unreadCount} /> : null}
      {user ? <UserMenu locale={locale} user={user} /> : null}
      <LanguageSwitcher locale={locale} />
    </div>
  );
}
