import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { CsrfInput } from '@/components/csrf-input';
import { getSmtpSettings } from '@/lib/smtp';

type Tab = 'users' | 'settings' | 'notifications';

function TabLink({ locale, tab, activeTab, label }: { locale: string; tab: Tab; activeTab: Tab; label: string }) {
  return (
    <Link
      href={`/${locale}/admin?tab=${tab}`}
      className={`rounded-lg border px-3 py-2 text-sm ${activeTab === tab ? 'bg-slate-900 text-white' : 'bg-white'}`}
    >
      {label}
    </Link>
  );
}

export default async function AdminPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { tab?: string; smtpError?: string; smtpTest?: string };
}) {
  const admin = await getCurrentUser();
  if (!admin) redirect(`/${params.locale}/login`);
  if (admin.role !== 'ADMIN') redirect(`/${params.locale}/app`);

  const activeTab: Tab =
    searchParams.tab === 'users' || searchParams.tab === 'settings' || searchParams.tab === 'notifications'
      ? searchParams.tab
      : 'users';

  const users = activeTab === 'users' || activeTab === 'notifications'
    ? await prisma.user.findMany({ where: activeTab === 'notifications' ? { emailVerifiedAt: { not: null } } : undefined, orderBy: { createdAt: 'desc' } })
    : [];

  const smtp = activeTab === 'settings' ? await getSmtpSettings() : null;

  const template = activeTab === 'notifications'
    ? await prisma.appSetting.findUnique({ where: { key: 'annualReminderTemplate' } })
    : null;
  const templateValue = (template?.value || {}) as Record<string, string>;

  const logs = activeTab === 'notifications'
    ? await prisma.notificationDeliveryLog.findMany({
        include: {
          user: { select: { email: true, username: true } },
          notification: { select: { titleEn: true, createdAt: true } }
        },
        orderBy: { sentAt: 'desc' },
        take: 25
      })
    : [];

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Admin</h1>

      <div className="flex flex-wrap gap-2">
        <TabLink locale={params.locale} tab="users" activeTab={activeTab} label="Users" />
        <TabLink locale={params.locale} tab="settings" activeTab={activeTab} label="Settings" />
        <TabLink locale={params.locale} tab="notifications" activeTab={activeTab} label="Notifications" />
      </div>

      {activeTab === 'users' ? (
        <>
          <form className="card grid gap-2 md:grid-cols-2" method="post" action="/api/admin/users">
            <CsrfInput />
            <input type="hidden" name="action" value="create" />
            <input type="hidden" name="locale" value={params.locale} />
            <input name="username" className="rounded border p-2" placeholder="Username" required />
            <input name="name" className="rounded border p-2" placeholder="Name" required />
            <input name="email" type="email" className="rounded border p-2" placeholder="Email" required />
            <input name="password" type="password" className="rounded border p-2" placeholder="Temp password" required />
            <select name="role" className="rounded border p-2">
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <label className="flex items-center gap-2 rounded border p-2"><input name="verified" type="checkbox" /> Verified</label>
            <button className="rounded bg-brand p-2 text-white md:col-span-2">Create user</button>
          </form>

          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <div className="text-sm">{user.emailVerifiedAt ? 'Verified' : 'Pending verification'}</div>
                </div>

                <form className="grid gap-2 md:grid-cols-4" method="post" action="/api/admin/users">
                  <CsrfInput />
                  <input type="hidden" name="action" value="update-meta" />
                  <input type="hidden" name="locale" value={params.locale} />
                  <input type="hidden" name="userId" value={user.id} />
                  <select name="role" className="rounded border p-2" defaultValue={user.role}>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <label className="flex items-center gap-2 rounded border p-2"><input name="verified" type="checkbox" defaultChecked={!!user.emailVerifiedAt} /> Verified</label>
                  <button className="rounded border p-2">Save role/verification</button>
                </form>

                <form className="grid gap-2 md:grid-cols-4" method="post" action="/api/admin/users">
                  <CsrfInput />
                  <input type="hidden" name="action" value="reset-password" />
                  <input type="hidden" name="locale" value={params.locale} />
                  <input type="hidden" name="userId" value={user.id} />
                  <input name="newPassword" type="password" className="rounded border p-2 md:col-span-2" placeholder="New password" required minLength={8} />
                  <button className="rounded border p-2">Reset password</button>
                </form>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {activeTab === 'settings' ? (
        <>
          {searchParams.smtpError === 'password-required' ? (
            <p className="text-sm text-red-600">Password is required for initial SMTP setup.</p>
          ) : null}
          {searchParams.smtpError === 'smtp-connection-failed' ? (
            <p className="text-sm text-red-600">SMTP connection failed. Try 465+secure on, or 587+secure off.</p>
          ) : null}
          {searchParams.smtpError === 'smtp-test-failed' ? (
            <p className="text-sm text-red-600">SMTP test failed. Check credentials and provider policy.</p>
          ) : null}
          {searchParams.smtpTest === 'ok' ? <p className="text-sm text-green-700">SMTP test email sent successfully.</p> : null}

          <form className="card grid gap-2 md:grid-cols-2" method="post" action="/api/admin/settings/smtp">
            <CsrfInput />
            <input type="hidden" name="locale" value={params.locale} />
            <input name="host" className="rounded border p-2" placeholder="Host" required defaultValue={smtp?.host || ''} />
            <input name="port" type="number" className="rounded border p-2" placeholder="Port" required defaultValue={smtp?.port || 587} />
            <label className="flex items-center gap-2 rounded border p-2"><input name="secure" type="checkbox" defaultChecked={!!smtp?.secure} /> Secure</label>
            <input name="username" className="rounded border p-2" placeholder="Username" required defaultValue={smtp?.username || ''} />
            <input name="password" type="password" className="rounded border p-2" placeholder={smtp?.password ? 'Saved password (leave blank to keep)' : 'Password'} />
            <input name="fromName" className="rounded border p-2" placeholder="From name" required defaultValue={smtp?.fromName || ''} />
            <input name="fromEmail" type="email" className="rounded border p-2" placeholder="From email" required defaultValue={smtp?.fromEmail || ''} />
            <button className="rounded bg-brand p-2 text-white md:col-span-2">Save SMTP Settings</button>
          </form>

          <form className="card flex flex-wrap gap-2" method="post" action="/api/admin/settings/smtp?test=1">
            <CsrfInput />
            <input type="hidden" name="locale" value={params.locale} />
            <input name="to" className="rounded border p-2" placeholder="test@site.com" required />
            <button className="rounded border px-3 py-2">Send Test Email</button>
          </form>
        </>
      ) : null}

      {activeTab === 'notifications' ? (
        <>
          <form className="card space-y-2" method="post" action="/api/admin/notifications">
            <CsrfInput />
            <input type="hidden" name="action" value="send" />
            <input type="hidden" name="locale" value={params.locale} />
            <h2 className="text-lg font-semibold">Send Notification</h2>
            <select name="recipientUserId" className="w-full rounded border p-2" defaultValue="">
              <option value="">Broadcast to all verified users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.username} ({user.email})</option>
              ))}
            </select>
            <input className="w-full rounded border p-2" name="titleEn" placeholder="Title EN" required />
            <textarea className="w-full rounded border p-2" name="bodyEn" placeholder="Body EN" required />
            <input className="w-full rounded border p-2" name="titleUr" placeholder="Title UR" required />
            <textarea className="w-full rounded border p-2" name="bodyUr" placeholder="Body UR" required />
            <button className="rounded bg-brand p-2 text-white">Send</button>
          </form>

          <form className="card space-y-2" method="post" action="/api/admin/notifications">
            <CsrfInput />
            <input type="hidden" name="action" value="save-template" />
            <input type="hidden" name="locale" value={params.locale} />
            <h2 className="text-lg font-semibold">Annual Reminder Template</h2>
            <input className="w-full rounded border p-2" name="titleEn" defaultValue={templateValue.titleEn || ''} placeholder="Title EN" required />
            <textarea className="w-full rounded border p-2" name="bodyEn" defaultValue={templateValue.bodyEn || ''} placeholder="Body EN" required />
            <input className="w-full rounded border p-2" name="titleUr" defaultValue={templateValue.titleUr || ''} placeholder="Title UR" required />
            <textarea className="w-full rounded border p-2" name="bodyUr" defaultValue={templateValue.bodyUr || ''} placeholder="Body UR" required />
            <button className="rounded border px-3 py-2">Save template</button>
          </form>

          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">Delivery Logs</h2>
            <div className="space-y-2 text-sm">
              {logs.map((log) => (
                <div key={log.id} className="rounded border p-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span>{log.user.username} · {log.user.email}</span>
                    <span>{new Date(log.sentAt).toLocaleString()}</span>
                  </div>
                  <div>{log.channel} · {log.status}</div>
                  <div className="text-slate-500">{log.notification.titleEn}</div>
                  {log.error ? <div className="text-red-600">{log.error}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
