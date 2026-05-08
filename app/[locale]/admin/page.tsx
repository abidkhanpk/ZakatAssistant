import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { CsrfInput } from '@/components/csrf-input';
import { DeleteUserButton } from '@/components/admin/delete-user-button';
import { getSmtpSettings } from '@/lib/smtp';
import { MAX_RECORDS_MUTATION_TIMEOUT_MS, MIN_RECORDS_MUTATION_TIMEOUT_MS, getRecordMutationTimeoutMs } from '@/lib/runtime-settings';

type Tab = 'users' | 'settings' | 'notifications';

type AdminUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  emailVerifiedAt: Date | null;
};

function TabLink({ locale, tab, activeTab, label }: { locale: string; tab: Tab; activeTab: Tab; label: string }) {
  return (
    <Link href={`/${locale}/admin?tab=${tab}`} className={`rounded-lg border px-3 py-2 text-sm ${activeTab === tab ? 'bg-slate-900 text-white' : 'bg-white'}`}>
      {label}
    </Link>
  );
}

export default async function AdminPage({ params, searchParams }: { params: { locale: string }; searchParams: { tab?: string; smtpError?: string; smtpErrorMessage?: string; smtpTest?: string; runtimeSaved?: string; runtimeError?: string; userError?: string } }) {
  const admin = await getCurrentUser();
  if (!admin) redirect(`/${params.locale}/login`);
  if (admin.role !== 'ADMIN') redirect(`/${params.locale}/app`);
  const isUr = params.locale === 'ur';

  const activeTab: Tab = searchParams.tab === 'users' || searchParams.tab === 'settings' || searchParams.tab === 'notifications' ? searchParams.tab : 'users';

  const users: AdminUser[] = activeTab === 'users' || activeTab === 'notifications'
    ? await prisma.user.findMany({
        where: activeTab === 'notifications' ? { emailVerifiedAt: { not: null } } : undefined,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, name: true, email: true, role: true, emailVerifiedAt: true }
      })
    : [];

  const smtp = activeTab === 'settings' ? await getSmtpSettings() : null;
  const recordsMutationTimeoutMs = activeTab === 'settings' ? await getRecordMutationTimeoutMs() : null;
  const template = activeTab === 'notifications' ? await prisma.appSetting.findUnique({ where: { key: 'annualReminderTemplate' } }) : null;
  const templateValue = (template?.value || {}) as Record<string, string>;

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">{isUr ? 'انتظامیہ' : 'Admin'}</h1>
      <div className="flex flex-wrap gap-2">
        <TabLink locale={params.locale} tab="users" activeTab={activeTab} label={isUr ? 'صارفین' : 'Users'} />
        <TabLink locale={params.locale} tab="settings" activeTab={activeTab} label={isUr ? 'ترتیبات' : 'Settings'} />
        <TabLink locale={params.locale} tab="notifications" activeTab={activeTab} label={isUr ? 'اطلاعات' : 'Notifications'} />
      </div>

      {activeTab === 'users' ? (
        <>
          {searchParams.userError ? (
            <p className="text-sm text-red-600">
              {searchParams.userError === 'email-taken'
                ? (isUr ? 'یہ ای میل پہلے سے استعمال ہو رہی ہے۔' : 'This email is already in use.')
                : searchParams.userError === 'username-taken'
                  ? (isUr ? 'یہ یوزرنیم پہلے سے استعمال ہو رہا ہے۔' : 'This username is already in use.')
                  : searchParams.userError === 'invalid-input'
                    ? (isUr ? 'فراہم کردہ معلومات درست نہیں ہیں۔' : 'Provided user details are invalid.')
                    : searchParams.userError === 'not-found'
                      ? (isUr ? 'صارف نہیں ملا۔' : 'User not found.')
                      : searchParams.userError === 'duplicate'
                        ? (isUr ? 'یہ ریکارڈ پہلے سے موجود ہے۔' : 'Duplicate value already exists.')
                        : (isUr ? 'صارف محفوظ کرتے وقت خرابی آ گئی۔' : 'Failed to save user due to an unexpected error.')}
            </p>
          ) : null}
          <form className="card grid gap-2 md:grid-cols-2" method="post" action="/api/admin/users">
            <CsrfInput />
            <input type="hidden" name="action" value="create" />
            <input type="hidden" name="locale" value={params.locale} />
            <input name="username" className="rounded border p-2" placeholder={isUr ? 'یوزرنیم' : 'Username'} required />
            <input name="name" className="rounded border p-2" placeholder={isUr ? 'نام' : 'Name'} required />
            <input name="email" type="email" className="rounded border p-2" placeholder="Email" required />
            <input name="password" type="password" className="rounded border p-2" placeholder={isUr ? 'عارضی پاس ورڈ' : 'Temp password'} required />
            <select name="role" className="rounded border p-2"><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select>
            <label className="flex items-center gap-2 rounded border p-2"><input name="verified" type="checkbox" /> {isUr ? 'تصدیق شدہ' : 'Verified'}</label>
            <button className="rounded bg-brand p-2 text-white md:col-span-2">{isUr ? 'صارف بنائیں' : 'Create user'}</button>
          </form>

          <div className="card overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">{isUr ? 'یوزرنیم' : 'Username'}</th><th className="p-2">{isUr ? 'نام' : 'Name'}</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">{isUr ? 'تصدیق' : 'Verified'}</th><th className="p-2">{isUr ? 'پاس ورڈ' : 'Password'}</th><th className="p-2">{isUr ? 'عمل' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b align-top">
                    <td className="p-2" colSpan={7}>
                      <form className="grid gap-2 md:grid-cols-7" method="post" action="/api/admin/users">
                        <CsrfInput />
                        <input type="hidden" name="action" value="update-full" />
                        <input type="hidden" name="locale" value={params.locale} />
                        <input type="hidden" name="userId" value={user.id} />
                        <input name="username" className="rounded border p-2" defaultValue={user.username} required />
                        <input name="name" className="rounded border p-2" defaultValue={user.name} required />
                        <input name="email" type="email" className="rounded border p-2" defaultValue={user.email} required />
                        <select name="role" className="rounded border p-2" defaultValue={user.role}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select>
                        <label className="flex items-center gap-2 rounded border p-2"><input name="verified" type="checkbox" defaultChecked={!!user.emailVerifiedAt} /> {isUr ? 'تصدیق شدہ' : 'Verified'}</label>
                        <input name="newPassword" type="password" className="rounded border p-2" placeholder={isUr ? 'نیا پاس ورڈ (اختیاری)' : 'New password (optional)'} minLength={8} />
                        <div className="flex items-center gap-2">
                          <button className="rounded border p-2">{isUr ? 'محفوظ کریں' : 'Save'}</button>
                          {user.id !== admin.id ? (
                            <DeleteUserButton isUr={isUr} />
                          ) : null}
                        </div>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {activeTab === 'settings' ? (
        <>
          {searchParams.smtpError ? (
            <p className="text-sm text-red-600">
              {searchParams.smtpError === 'password-required'
                ? (isUr ? 'SMTP پاس ورڈ درج کریں۔' : 'SMTP password is required.')
                : searchParams.smtpError === 'invalid-settings'
                  ? (isUr ? 'SMTP سیٹنگز نامکمل یا غلط ہیں۔' : 'SMTP settings are incomplete or invalid.')
                  : searchParams.smtpError === 'invalid-test-recipient'
                    ? (isUr ? 'ٹیسٹ ای میل کے لئے درست ای میل پتہ درج کریں۔' : 'Enter a valid email address for the test email.')
                    : searchParams.smtpError === 'smtp-connection-failed'
                      ? (isUr ? 'SMTP کنکشن ناکام ہو گیا۔' : 'SMTP connection failed.')
                      : (isUr ? 'SMTP ٹیسٹ ناکام ہو گیا۔' : 'SMTP test failed.')}
              {searchParams.smtpErrorMessage ? ` ${searchParams.smtpErrorMessage}` : ''}
            </p>
          ) : null}
          {smtp?.decryptFailed ? (
            <p className="text-sm text-amber-700">
              {isUr
                ? 'محفوظ شدہ SMTP پاس ورڈ موجودہ انکرپشن کلید سے نہیں کھل سکا۔ براہِ کرم پاس ورڈ دوبارہ درج کر کے محفوظ کریں۔'
                : 'Saved SMTP password could not be decrypted with the current encryption key. Please re-enter and save the password.'}
            </p>
          ) : null}
          {searchParams.smtpTest === 'ok' ? <p className="text-sm text-green-700">{isUr ? 'SMTP ٹیسٹ ای میل بھیج دی گئی۔' : 'SMTP test email sent successfully.'}</p> : null}
          {searchParams.runtimeSaved === '1' ? <p className="text-sm text-green-700">{isUr ? 'رن ٹائم ٹائم آؤٹ محفوظ ہو گیا۔' : 'Runtime timeout saved successfully.'}</p> : null}
          {searchParams.runtimeError ? <p className="text-sm text-red-600">{isUr ? 'رن ٹائم ٹائم آؤٹ غلط ہے۔' : 'Invalid runtime timeout value.'}</p> : null}
          <form className="card grid gap-2 md:grid-cols-2" method="post" action="/api/admin/settings/runtime">
            <CsrfInput />
            <input type="hidden" name="locale" value={params.locale} />
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold">{isUr ? 'رن ٹائم ٹائم آؤٹ' : 'Runtime Timeout'}</h2>
              <p className="text-sm text-slate-600">
                {isUr
                  ? 'ریکارڈ اپ ڈیٹ کے دوران پراسیس ٹائم آؤٹ ملی سیکنڈ میں سیٹ کریں۔'
                  : 'Set record update processing timeout in milliseconds.'}
              </p>
            </div>
            <input
              name="recordsMutationTimeoutMs"
              type="number"
              min={MIN_RECORDS_MUTATION_TIMEOUT_MS}
              max={MAX_RECORDS_MUTATION_TIMEOUT_MS}
              step={1000}
              className="rounded border p-2"
              defaultValue={recordsMutationTimeoutMs || MAX_RECORDS_MUTATION_TIMEOUT_MS}
              required
            />
            <p className="rounded border p-2 text-sm text-slate-600">
              {isUr
                ? `حد: ${MIN_RECORDS_MUTATION_TIMEOUT_MS} تا ${MAX_RECORDS_MUTATION_TIMEOUT_MS} ملی سیکنڈ`
                : `Allowed range: ${MIN_RECORDS_MUTATION_TIMEOUT_MS} to ${MAX_RECORDS_MUTATION_TIMEOUT_MS} ms`}
            </p>
            <button className="rounded border px-3 py-2 md:col-span-2">{isUr ? 'رن ٹائم ٹائم آؤٹ محفوظ کریں' : 'Save Runtime Timeout'}</button>
          </form>
          <form className="card grid gap-2 md:grid-cols-2" method="post" action="/api/admin/settings/smtp">
            <CsrfInput />
            <input type="hidden" name="locale" value={params.locale} />
            <input name="host" className="rounded border p-2" placeholder="Host" required defaultValue={smtp?.host || ''} />
            <div className="flex gap-2">
              <select
                name="security"
                className="w-[72%] rounded border p-2"
                defaultValue={smtp?.security || (smtp?.secure ? 'ssl' : 'tls')}
              >
                <option value="tls">TLS (STARTTLS / 587)</option>
                <option value="ssl">SSL (Implicit TLS / 465)</option>
              </select>
              <input name="port" type="number" className="w-[28%] rounded border p-2" placeholder="Port" required defaultValue={smtp?.port || 587} />
            </div>
            <input name="username" className="rounded border p-2" placeholder={isUr ? 'یوزرنیم' : 'Username'} required defaultValue={smtp?.username || ''} />
            <input name="password" type="password" className="rounded border p-2" placeholder={smtp?.password ? (isUr ? 'محفوظ پاس ورڈ (خالی چھوڑیں)' : 'Saved password (leave blank to keep)') : (isUr ? 'پاس ورڈ' : 'Password')} />
            <input name="fromName" className="rounded border p-2" placeholder={isUr ? 'بھیجنے والا نام' : 'From name'} required defaultValue={smtp?.fromName || ''} />
            <input name="fromEmail" type="email" className="rounded border p-2" placeholder="From email" required defaultValue={smtp?.fromEmail || ''} />
            <input
              name="to"
              type="email"
              className="rounded border p-2 md:col-span-2"
              placeholder={isUr ? 'ٹیسٹ ای میل وصول کنندہ (اختیاری)' : 'Test email recipient (optional)'}
              defaultValue={admin.email}
            />
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button className="rounded bg-brand px-3 py-2 text-white">{isUr ? 'SMTP محفوظ کریں' : 'Save SMTP Settings'}</button>
              <button
                className="rounded border px-3 py-2"
                type="submit"
                formAction="/api/admin/settings/smtp?test=1"
              >
                {isUr ? 'ٹیسٹ ای میل بھیجیں' : 'Send Test Email'}
              </button>
            </div>
          </form>
        </>
      ) : null}

      {activeTab === 'notifications' ? (
        <div className="card space-y-2">
          <form className="space-y-2" method="post" action="/api/admin/notifications">
            <CsrfInput /><input type="hidden" name="action" value="send" /><input type="hidden" name="locale" value={params.locale} />
            <h2 className="text-lg font-semibold">{isUr ? 'اطلاع بھیجیں' : 'Send Notification'}</h2>
            <select name="recipientUserId" className="w-full rounded border p-2" defaultValue=""><option value="">{isUr ? 'تمام تصدیق شدہ صارفین' : 'Broadcast to all verified users'}</option>{users.map((user) => <option key={user.id} value={user.id}>{user.username} ({user.email})</option>)}</select>
            <input className="w-full rounded border p-2" name="titleEn" placeholder="Title EN" required />
            <textarea className="w-full rounded border p-2" name="bodyEn" placeholder="Body EN" required />
            <input className="w-full rounded border p-2" name="titleUr" placeholder="Title UR" required />
            <textarea className="w-full rounded border p-2" name="bodyUr" placeholder="Body UR" required />
            <button className="rounded bg-brand p-2 text-white">{isUr ? 'بھیجیں' : 'Send'}</button>
          </form>
          <form className="space-y-2" method="post" action="/api/admin/notifications">
            <CsrfInput /><input type="hidden" name="action" value="save-template" /><input type="hidden" name="locale" value={params.locale} />
            <h2 className="text-lg font-semibold">{isUr ? 'سالانہ یاددہانی ٹیمپلیٹ' : 'Annual Reminder Template'}</h2>
            <input className="w-full rounded border p-2" name="titleEn" defaultValue={templateValue.titleEn || ''} placeholder="Title EN" required />
            <textarea className="w-full rounded border p-2" name="bodyEn" defaultValue={templateValue.bodyEn || ''} placeholder="Body EN" required />
            <input className="w-full rounded border p-2" name="titleUr" defaultValue={templateValue.titleUr || ''} placeholder="Title UR" required />
            <textarea className="w-full rounded border p-2" name="bodyUr" defaultValue={templateValue.bodyUr || ''} placeholder="Body UR" required />
            <button className="rounded border px-3 py-2">{isUr ? 'ٹیمپلیٹ محفوظ کریں' : 'Save template'}</button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
