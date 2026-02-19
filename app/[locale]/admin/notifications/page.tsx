import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { CsrfInput } from '@/components/csrf-input';

export default async function AdminNotifications({ params }: { params: { locale: string } }) {
  const admin = await getCurrentUser();
  if (!admin) redirect(`/${params.locale}/login`);
  if (admin.role !== 'ADMIN') redirect(`/${params.locale}/app`);

  const users = await prisma.user.findMany({ where: { emailVerifiedAt: { not: null } }, orderBy: { createdAt: 'desc' } });
  const template = await prisma.appSetting.findUnique({ where: { key: 'annualReminderTemplate' } });
  const value = (template?.value || {}) as Record<string, string>;
  const logs = await prisma.notificationDeliveryLog.findMany({
    include: {
      user: { select: { email: true, username: true } },
      notification: { select: { titleEn: true, createdAt: true } }
    },
    orderBy: { sentAt: 'desc' },
    take: 25
  });

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Admin · Notifications</h1>

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
        <input className="w-full rounded border p-2" name="titleEn" defaultValue={value.titleEn || ''} placeholder="Title EN" required />
        <textarea className="w-full rounded border p-2" name="bodyEn" defaultValue={value.bodyEn || ''} placeholder="Body EN" required />
        <input className="w-full rounded border p-2" name="titleUr" defaultValue={value.titleUr || ''} placeholder="Title UR" required />
        <textarea className="w-full rounded border p-2" name="bodyUr" defaultValue={value.bodyUr || ''} placeholder="Body UR" required />
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
    </main>
  );
}
