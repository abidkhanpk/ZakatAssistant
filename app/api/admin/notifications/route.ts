import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendEmail } from '@/lib/smtp';
import { isSameOrigin } from '@/lib/security';
import { z } from 'zod';
import { hasValidCsrfToken } from '@/lib/csrf';

const sendSchema = z.object({
  titleEn: z.string().min(1),
  bodyEn: z.string().min(1),
  titleUr: z.string().min(1),
  bodyUr: z.string().min(1),
  recipientUserId: z.preprocess((value) => {
    const str = String(value || '').trim();
    return str.length ? str : undefined;
  }, z.string().optional()),
  locale: z.string().default('en')
});

const templateSchema = z.object({
  titleEn: z.string().min(1),
  bodyEn: z.string().min(1),
  titleUr: z.string().min(1),
  bodyUr: z.string().min(1),
  locale: z.string().default('en')
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const form = Object.fromEntries(formData);
  const action = String(form.action || 'send');

  if (action === 'save-template') {
    const data = templateSchema.parse(form);
    const { locale: _locale, ...template } = data;
    await prisma.appSetting.upsert({
      where: { key: 'annualReminderTemplate' },
      create: { key: 'annualReminderTemplate', value: template },
      update: { value: template }
    });
    return NextResponse.redirect(new URL(`/${data.locale}/admin?tab=notifications`, req.url), 303);
  }

  const data = sendSchema.parse(form);
  const targetUserIds = data.recipientUserId
    ? [data.recipientUserId]
    : (
        await prisma.user.findMany({ where: { emailVerifiedAt: { not: null } }, select: { id: true } })
      ).map((u: { id: string }) => u.id);

  const notification = await prisma.notification.create({
    data: {
      recipientUserId: data.recipientUserId || null,
      titleEn: data.titleEn,
      bodyEn: data.bodyEn,
      titleUr: data.titleUr,
      bodyUr: data.bodyUr,
      sentByAdminId: admin.id
    }
  });

  await Promise.all(
    targetUserIds.map(async (userId: string) => {
      await prisma.notificationDeliveryLog.create({
        data: {
          notificationId: notification.id,
          userId,
          channel: 'IN_APP',
          status: 'SENT'
        }
      });

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (!user) return;

      try {
        await sendEmail(user.email, data.titleEn, data.bodyEn);
        await prisma.notificationDeliveryLog.create({
          data: {
            notificationId: notification.id,
            userId,
            channel: 'EMAIL',
            status: 'SENT'
          }
        });
      } catch (error: unknown) {
        await prisma.notificationDeliveryLog.create({
          data: {
            notificationId: notification.id,
            userId,
            channel: 'EMAIL',
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Email send failed'
          }
        });
      }
    })
  );

  return NextResponse.redirect(new URL(`/${data.locale}/admin?tab=notifications`, req.url), 303);
}
