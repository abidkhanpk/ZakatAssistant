import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sha256 } from '@/lib/crypto';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const locale = searchParams.get('locale') || 'en';
  const purpose = searchParams.get('purpose') || 'signup';
  if (!token) return NextResponse.redirect(new URL(`/${locale}/login`, req.url), 303);

  try {
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
      if (purpose === 'email-change') {
        return NextResponse.redirect(new URL(`/${locale}/app/profile?emailChanged=1`, req.url), 303);
      }
    }
  } catch (error) {
    if (purpose === 'email-change' && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.redirect(new URL(`/${locale}/app/profile?emailChangeError=email-taken`, req.url), 303);
    }
    console.error('Email verification failed', error);
    if (purpose === 'email-change') {
      return NextResponse.redirect(new URL(`/${locale}/app/profile?emailChangeError=unexpected`, req.url), 303);
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/login`, req.url), 303);
}
