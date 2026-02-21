import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CsrfInput } from '@/components/csrf-input';
import { getSmtpSettings } from '@/lib/smtp';

export default async function AdminSettings({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { smtpError?: string };
}) {
  const admin = await getCurrentUser();
  if (!admin) redirect(`/${params.locale}/login`);
  if (admin.role !== 'ADMIN') redirect(`/${params.locale}/app`);
  const smtp = await getSmtpSettings();

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Admin Settings</h1>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">SMTP</h2>
        {searchParams.smtpError === 'password-required' ? (
          <p className="text-sm text-red-600">Password is required for initial SMTP setup.</p>
        ) : null}
        <form className="card grid gap-2 md:grid-cols-2" method="post" action="/api/admin/settings/smtp">
          <CsrfInput />
          <input type="hidden" name="locale" value={params.locale} />
          <input name="host" className="rounded border p-2" placeholder="Host" required defaultValue={smtp?.host || ''} />
          <input name="port" type="number" className="rounded border p-2" placeholder="Port" required defaultValue={smtp?.port || 587} />
          <label className="flex items-center gap-2 rounded border p-2"><input name="secure" type="checkbox" defaultChecked={!!smtp?.secure} /> Secure</label>
          <input name="username" className="rounded border p-2" placeholder="Username" required defaultValue={smtp?.username || ''} />
          <input
            name="password"
            type="password"
            className="rounded border p-2"
            placeholder={smtp?.password ? 'Saved password (leave blank to keep)' : 'Password'}
          />
          <input name="fromName" className="rounded border p-2" placeholder="From name" required defaultValue={smtp?.fromName || ''} />
          <input name="fromEmail" type="email" className="rounded border p-2" placeholder="From email" required defaultValue={smtp?.fromEmail || ''} />
          <button className="rounded bg-brand p-2 text-white md:col-span-2">Save SMTP Settings</button>
        </form>
      </section>

      <form className="card flex flex-wrap gap-2" method="post" action="/api/admin/settings/smtp?test=1">
        <CsrfInput />
        <input type="hidden" name="locale" value={params.locale} />
        <input name="to" className="rounded border p-2" placeholder="test@site.com" required />
        <button className="rounded border px-3 py-2">Send Test Email</button>
      </form>
    </main>
  );
}
