import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth';
import { TopRightControls } from '@/components/top-right-controls';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { prisma } from '@/lib/prisma';

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const messages = await getMessages();
  const isUr = params.locale === 'ur';
  const user = await getCurrentUser();

  const notifications = user
    ? await prisma.notification.findMany({
        where: { OR: [{ recipientUserId: user.id }, { recipientUserId: null }] },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, titleEn: true, titleUr: true, readAt: true }
      })
    : [];
  type NotificationRow = (typeof notifications)[number];

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      style={{
        fontFamily: isUr
          ? '"Gulzar", "Noto Nastaliq Urdu", "Noto Naskh Arabic", Georgia, serif'
          : 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      <NextIntlClientProvider locale={params.locale} messages={messages}>
        <TopRightControls
          locale={isUr ? 'ur' : 'en'}
          user={
            user
              ? {
                  name: user.name,
                  username: user.username,
                  role: user.role
                }
              : null
          }
          notifications={notifications.map((n: NotificationRow) => ({ id: n.id, titleEn: n.titleEn, titleUr: n.titleUr }))}
          unreadCount={notifications.filter((n: NotificationRow) => !n.readAt).length}
        />
        <div className="mx-auto max-w-6xl px-4 pt-14">
          <Breadcrumbs locale={isUr ? 'ur' : 'en'} />
        </div>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
