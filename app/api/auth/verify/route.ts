import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sha256 } from '@/lib/crypto';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const locale = searchParams.get('locale') || 'en';
  if (!token) return NextResponse.redirect(new URL(`/${locale}/login`, req.url), 303);

  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (record && !record.usedAt && record.expiresAt > new Date()) {
    await prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
    await prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  }

  return NextResponse.redirect(new URL(`/${locale}/login`, req.url), 303);
}
