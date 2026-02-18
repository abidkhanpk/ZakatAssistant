import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Please login</main>;
  const notifications = await prisma.notification.findMany({ where: { OR: [{ recipientUserId: null }, { recipientUserId: user.id }] }, orderBy: { createdAt: 'desc' } });
  return <main className="p-4 space-y-2">{notifications.map((n)=><div key={n.id} className="card"><h3>{n.titleEn}</h3><p>{n.bodyEn}</p></div>)}</main>;
}
