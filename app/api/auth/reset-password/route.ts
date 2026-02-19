import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';
import { sha256 } from '@/lib/crypto';
import { hashPassword } from '@/lib/auth';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  locale: z.string().default('en')
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const data = schema.parse(Object.fromEntries(formData));
  if (data.password !== data.confirmPassword) {
    return NextResponse.redirect(new URL(`/${data.locale}/reset-password?token=${encodeURIComponent(data.token)}&error=1`, req.url), 303);
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(data.token) }
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return NextResponse.redirect(new URL(`/${data.locale}/reset-password?expired=1`, req.url), 303);
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: await hashPassword(data.password) }
  });

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() }
  });

  return NextResponse.redirect(new URL(`/${data.locale}/login?reset=1`, req.url), 303);
}
