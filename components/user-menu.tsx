import Link from 'next/link';
import { cookies } from 'next/headers';

type UserMenuProps = {
  locale: 'en' | 'ur';
  user: { name: string; username: string; role: 'USER' | 'ADMIN' };
};

export function UserMenu({ locale, user }: UserMenuProps) {
  const csrf = cookies().get('csrf_token')?.value || '';
  const isUr = locale === 'ur';

  return (
    <details className="relative">
      <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full border bg-white/90 text-sm shadow-sm">
        👤
      </summary>
      <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white p-3 shadow-lg">
        <p className="font-semibold">{user.name}</p>
        <p className="text-xs text-slate-500">@{user.username}</p>
        <p className="mt-1 text-xs text-slate-500">{user.role}</p>
        <div className="mt-3 space-y-2 text-sm">
          <Link className="block rounded border px-2 py-1 hover:bg-slate-50" href={`/${locale}/app/profile`}>
            {isUr ? 'پروفائل ترتیبات' : 'Profile settings'}
          </Link>
          <Link className="block rounded border px-2 py-1 hover:bg-slate-50" href={`/${locale}/app/settings`}>
            {isUr ? 'صارف ترتیبات' : 'User settings'}
          </Link>
          <form method="post" action="/api/auth/logout">
            <input type="hidden" name="csrfToken" value={csrf} />
            <input type="hidden" name="locale" value={locale} />
            <button className="w-full rounded border border-red-200 px-2 py-1 text-left text-red-600 hover:bg-red-50">
              {isUr ? 'سائن آؤٹ' : 'Sign out'}
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
