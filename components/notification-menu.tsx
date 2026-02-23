'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand/35 hover:bg-brand/5 hover:text-brand"
        aria-label={isUr ? 'اطلاعات' : 'Notifications'}
        aria-expanded={open}
      >
        <Bell size={16} strokeWidth={2.2} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
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
        <Link href={`/${locale}/app/notifications`} className="mt-3 block rounded border px-2 py-1 text-center" onClick={() => setOpen(false)}>
          {isUr ? 'تمام دیکھیں' : 'View all'}
        </Link>
        </div>
      ) : null}
    </div>
  );
}
