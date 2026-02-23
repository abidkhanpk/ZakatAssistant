'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type UserMenuProps = {
  locale: 'en' | 'ur';
  user: { name: string; username: string; role: 'USER' | 'ADMIN' };
  csrfToken: string;
};

export function UserMenu({ locale, user, csrfToken }: UserMenuProps) {
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
        aria-expanded={open}
        aria-label={isUr ? 'صارف مینو' : 'User menu'}
      >
        <User size={16} strokeWidth={2.2} />
      </button>
      {open ? (
        <div className={`absolute ${isUr ? 'left-0' : 'right-0'} mt-2 w-56 rounded-xl border bg-white p-3 shadow-lg`}>
        <p className="font-semibold">{user.name}</p>
        <p className="text-xs text-slate-500">@{user.username}</p>
        <p className="mt-1 text-xs text-slate-500">{user.role}</p>
        <div className="mt-3 space-y-2 text-sm">
          <Link className="block rounded border px-2 py-1 hover:bg-slate-50" href={`/${locale}/app/profile`} onClick={() => setOpen(false)}>
            {isUr ? 'پروفائل ترتیبات' : 'Profile settings'}
          </Link>
          {user.role === 'ADMIN' ? (
            <Link className="block rounded border px-2 py-1 hover:bg-slate-50" href={`/${locale}/admin?tab=settings`} onClick={() => setOpen(false)}>
              {isUr ? 'ایڈمن ترتیبات' : 'Admin settings'}
            </Link>
          ) : null}
          <form method="post" action="/api/auth/logout">
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="locale" value={locale} />
            <button className="w-full rounded border border-red-200 px-2 py-1 text-left text-red-600 hover:bg-red-50">
              {isUr ? 'سائن آؤٹ' : 'Sign out'}
            </button>
          </form>
        </div>
        </div>
      ) : null}
    </div>
  );
}
