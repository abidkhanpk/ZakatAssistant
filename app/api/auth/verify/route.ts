import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sha256 } from '@/lib/crypto';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const locale = searchParams.get('locale') || 'en';
  const purpose = searchParams.get('purpose') || 'signup';
  if (!token) return NextResponse.redirect(new URL(`/${locale}/login`, req.url), 303);

  const tokenHash = sha256(token);
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (record && !record.usedAt && record.expiresAt > new Date()) {
    if (purpose === 'email-change') {
      const pending = await prisma.appSetting.findUnique({ where: { key: `email-change:${tokenHash}` } });
      const nextEmail = (pending?.value as { email?: string } | null)?.email;
      if (nextEmail) {
        await prisma.user.update({ where: { id: record.userId }, data: { email: nextEmail, emailVerifiedAt: new Date() } });
        if (pending) await prisma.appSetting.delete({ where: { id: pending.id } });
      }
    } else {
      await prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
    }
    await prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  }

  return NextResponse.redirect(new URL(`/${locale}/login`, req.url), 303);
}
