import Link from 'next/link';

type NotificationItem = {
  id: string;
  titleEn: string;
  titleUr: string;
};

export function NotificationMenu({
  locale,
  unreadCount,
  notifications
}: {
  locale: 'en' | 'ur';
  unreadCount: number;
  notifications: NotificationItem[];
}) {
  const isUr = locale === 'ur';

  return (
    <details className="relative">
      <summary
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full border bg-white/90 text-sm shadow-sm"
        aria-label={isUr ? 'اطلاعات' : 'Notifications'}
      >
        🔔
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] text-white">
            {unreadCount}
          </span>
        ) : null}
      </summary>
      <div className="absolute right-0 mt-2 w-72 rounded-xl border bg-white p-3 shadow-lg">
        <p className="mb-2 text-sm font-semibold">{isUr ? 'اطلاعات' : 'Notifications'}</p>
        <div className="space-y-2 text-sm">
          {notifications.length ? (
            notifications.map((notification) => (
              <div key={notification.id} className="rounded border p-2">
                {isUr ? notification.titleUr : notification.titleEn}
              </div>
            ))
          ) : (
            <p className="text-slate-500">{isUr ? 'کوئی اطلاع نہیں' : 'No notifications'}</p>
          )}
        </div>
        <Link href={`/${locale}/app/notifications`} className="mt-3 block rounded border px-2 py-1 text-center">
          {isUr ? 'تمام دیکھیں' : 'View all'}
        </Link>
      </div>
    </details>
  );
}
