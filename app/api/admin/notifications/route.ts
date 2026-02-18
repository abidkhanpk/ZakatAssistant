import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendEmail } from '@/lib/smtp';

export async function POST(req: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const form = Object.fromEntries(await req.formData());
  const n = await prisma.notification.create({ data: { recipientUserId: null, titleEn: String(form.titleEn), bodyEn: String(form.bodyEn), titleUr: String(form.titleUr), bodyUr: String(form.bodyUr), sentByAdminId: admin.id } });
  const users = await prisma.user.findMany({ where: { emailVerifiedAt: { not: null } } });
  await Promise.all(users.map(async (u) => {
    try {
      await sendEmail(u.email, String(form.titleEn), String(form.bodyEn));
      await prisma.notificationDeliveryLog.create({ data: { notificationId: n.id, userId: u.id, channel: 'EMAIL', status: 'SENT' } });
    } catch (e: any) {
      await prisma.notificationDeliveryLog.create({ data: { notificationId: n.id, userId: u.id, channel: 'EMAIL', status: 'FAILED', error: e.message } });
    }
  }));
  return NextResponse.redirect(new URL('/en/admin/notifications', req.url));
}
