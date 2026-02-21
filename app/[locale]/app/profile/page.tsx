import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CsrfInput } from '@/components/csrf-input';

export default async function ProfilePage({ params, searchParams }: { params: { locale: string }; searchParams: { passwordError?: string; passwordUpdated?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);
  const isUr = params.locale === 'ur';

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="card space-y-2">
        <h1 className="text-2xl font-bold">{isUr ? 'پروفائل ترتیبات' : 'Profile settings'}</h1>
        <form className="space-y-2" method="post" action="/api/profile">
          <CsrfInput />
          <input type="hidden" name="action" value="update-profile" />
          <input type="hidden" name="locale" value={params.locale} />
          <input className="w-full rounded border p-2" name="name" defaultValue={user.name} required placeholder={isUr ? 'نام' : 'Name'} />
          <input className="w-full rounded border p-2" name="username" defaultValue={user.username} required placeholder={isUr ? 'یوزرنیم' : 'Username'} />
          <input className="w-full rounded border p-2" type="email" name="email" defaultValue={user.email} required placeholder="Email" />
          <p className="text-xs text-slate-500">{isUr ? 'ای میل بدلنے پر تصدیقی ای میل نئی ای میل پر بھیجی جائے گی۔' : 'Changing email sends a verification link to the new email.'}</p>
          <button className="rounded bg-brand px-3 py-2 text-white">{isUr ? 'پروفائل محفوظ کریں' : 'Save profile'}</button>
        </form>
      </div>

      <div className="card space-y-2">
        <h2 className="text-xl font-semibold">{isUr ? 'پاس ورڈ تبدیل کریں' : 'Change password'}</h2>
        {searchParams.passwordError === '1' ? <p className="text-sm text-red-600">{isUr ? 'موجودہ پاس ورڈ غلط ہے۔' : 'Current password is incorrect.'}</p> : null}
        {searchParams.passwordUpdated === '1' ? <p className="text-sm text-green-700">{isUr ? 'پاس ورڈ تبدیل ہو گیا۔' : 'Password updated.'}</p> : null}
        <form className="space-y-2" method="post" action="/api/profile">
          <CsrfInput />
          <input type="hidden" name="action" value="change-password" />
          <input type="hidden" name="locale" value={params.locale} />
          <input className="w-full rounded border p-2" name="currentPassword" type="password" required placeholder={isUr ? 'موجودہ پاس ورڈ' : 'Current password'} />
          <input className="w-full rounded border p-2" name="newPassword" type="password" required minLength={8} placeholder={isUr ? 'نیا پاس ورڈ' : 'New password'} />
          <button className="rounded border px-3 py-2">{isUr ? 'پاس ورڈ محفوظ کریں' : 'Update password'}</button>
        </form>
      </div>
    </main>
  );
}
