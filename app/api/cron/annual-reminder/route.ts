import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/smtp';
import { isAuthorizedCron } from '@/lib/security';

export async function POST(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({ where: { emailVerifiedAt: { not: null } } });
  const template = await prisma.appSetting.findUnique({ where: { key: 'annualReminderTemplate' } });
  const value = (template?.value || {}) as Record<string, string>;
  const year = new Date().getFullYear();

  for (const user of users) {
    const key = `annualReminder:${user.id}:${year}`;
    const sent = await prisma.appSetting.findUnique({ where: { key } });
    if (sent) continue;

    const notif = await prisma.notification.create({
      data: {
        recipientUserId: user.id,
        titleEn: value.titleEn || 'Annual reminder',
        bodyEn: value.bodyEn || 'Please calculate your Zakat.',
        titleUr: value.titleUr || 'سالانہ یاد دہانی',
        bodyUr: value.bodyUr || 'اپنی زکوٰۃ کا حساب لگائیں۔'
      }
    });

    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId: notif.id,
        userId: user.id,
        channel: 'IN_APP',
        status: 'SENT'
      }
    });

    try {
      await sendEmail(user.email, notif.titleEn, notif.bodyEn);
      await prisma.notificationDeliveryLog.create({
        data: {
          notificationId: notif.id,
          userId: user.id,
          channel: 'EMAIL',
          status: 'SENT'
        }
      });
    } catch (error: unknown) {
      await prisma.notificationDeliveryLog.create({
        data: {
          notificationId: notif.id,
          userId: user.id,
          channel: 'EMAIL',
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Email send failed'
        }
      });
    }

    await prisma.appSetting.create({ data: { key, value: { lastSentAt: new Date().toISOString() } } });
  }

  return NextResponse.json({ ok: true });
}
