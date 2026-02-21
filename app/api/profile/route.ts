import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';
import { hasValidCsrfToken } from '@/lib/csrf';
import { prisma } from '@/lib/prisma';
import { isSameOrigin } from '@/lib/security';
import { sha256 } from '@/lib/crypto';
import { sendEmail } from '@/lib/smtp';

const updateProfileSchema = z.object({
  action: z.literal('update-profile'),
  name: z.string().min(1),
  username: z.string().min(3),
  email: z.string().email(),
  locale: z.string().default('en')
});

const changePasswordSchema = z.object({
  action: z.literal('change-password'),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  locale: z.string().default('en')
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  const form = Object.fromEntries(formData);
  const action = String(form.action || '');

  if (action === 'update-profile') {
    const data = updateProfileSchema.parse(form);
    await prisma.user.update({ where: { id: user.id }, data: { name: data.name, username: data.username } });

    if (data.email !== user.email) {
      const token = randomUUID();
      const tokenHash = sha256(token);
      await prisma.emailVerificationToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) }
      });
      await prisma.appSetting.upsert({
        where: { key: `email-change:${tokenHash}` },
        create: { key: `email-change:${tokenHash}`, value: { email: data.email } },
        update: { value: { email: data.email } }
      });
      const link = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify?locale=${data.locale}&token=${token}&purpose=email-change`;
      await sendEmail(data.email, 'Confirm your new email', `<a href="${link}">Confirm Email</a>`);
    }

    return NextResponse.redirect(new URL(`/${data.locale}/app/profile`, req.url), 303);
  }

  if (action === 'change-password') {
    const data = changePasswordSchema.parse(form);
    const ok = await verifyPassword(user.passwordHash, data.currentPassword);
    if (!ok) return NextResponse.redirect(new URL(`/${data.locale}/app/profile?passwordError=1`, req.url), 303);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(data.newPassword) } });
    return NextResponse.redirect(new URL(`/${data.locale}/app/profile?passwordUpdated=1`, req.url), 303);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
