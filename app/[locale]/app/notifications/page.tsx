import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function NotificationsPage({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);

  const notifications = await prisma.notification.findMany({
    where: { OR: [{ recipientUserId: null }, { recipientUserId: user.id }] },
    orderBy: { createdAt: 'desc' }
  });

  const isUr = params.locale === 'ur';

  return (
    <main className="mx-auto max-w-3xl space-y-2 p-4">
      {notifications.map((notification: { id: string; titleEn: string; titleUr: string; bodyEn: string; bodyUr: string }) => (
        <div key={notification.id} className="card">
          <h3 className="font-semibold">{isUr ? notification.titleUr : notification.titleEn}</h3>
          <p className="text-sm text-slate-700">{isUr ? notification.bodyUr : notification.bodyEn}</p>
        </div>
      ))}
    </main>
  );
}
