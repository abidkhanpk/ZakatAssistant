import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';
import { hasValidCsrfToken } from '@/lib/csrf';
import { prisma } from '@/lib/prisma';
import { isSameOrigin } from '@/lib/security';
import { sha256 } from '@/lib/crypto';
import { sendEmail } from '@/lib/smtp';
import { getRequestOrigin } from '@/lib/request-origin';

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

function profileRedirect(req: Request, locale: string, params?: Record<string, string>) {
  const url = new URL(`/${locale}/app/profile`, req.url);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  const form = Object.fromEntries(formData);
  const action = String(form.action || '');
  const locale = typeof form.locale === 'string' && form.locale ? form.locale : 'en';

  if (action === 'update-profile') {
    const parsed = updateProfileSchema.safeParse(form);
    if (!parsed.success) {
      return profileRedirect(req, locale, { profileError: 'invalid-input' });
    }

    const data = parsed.data;

    try {
      await prisma.user.update({ where: { id: user.id }, data: { name: data.name, username: data.username } });

      if (data.email !== user.email) {
        const existingWithEmail = await prisma.user.findUnique({
          where: { email: data.email },
          select: { id: true }
        });
        if (existingWithEmail && existingWithEmail.id !== user.id) {
          return profileRedirect(req, data.locale, { profileError: 'email-taken' });
        }

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
        const link = `${getRequestOrigin(req)}/api/auth/verify?locale=${data.locale}&token=${token}&purpose=email-change`;
        const body = `
          <p>Hello ${user.name || user.username},</p>
          <p>We received a request to change your Zakat Assistant email address. Confirm your new email using the button below.</p>
          <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Confirm email</a></p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p><a href="${link}">${link}</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `;
        await sendEmail(data.email, 'Confirm your new email', body);
        return profileRedirect(req, data.locale, { emailChangeSent: '1' });
      }

      return profileRedirect(req, data.locale, { profileSaved: '1' });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : '';
          if (target.includes('username')) return profileRedirect(req, data.locale, { profileError: 'username-taken' });
          if (target.includes('email')) return profileRedirect(req, data.locale, { profileError: 'email-taken' });
          return profileRedirect(req, data.locale, { profileError: 'duplicate' });
        }
      }
      if (error instanceof Error && /SMTP/i.test(error.message)) {
        return profileRedirect(req, data.locale, { profileError: 'email-delivery-failed' });
      }
      console.error('Profile update failed', error);
      return profileRedirect(req, data.locale, { profileError: 'unexpected' });
    }
  }

  if (action === 'change-password') {
    const parsed = changePasswordSchema.safeParse(form);
    if (!parsed.success) {
      return profileRedirect(req, locale, { profileError: 'invalid-password-input' });
    }
    const data = parsed.data;
    const ok = await verifyPassword(user.passwordHash, data.currentPassword);
    if (!ok) return profileRedirect(req, data.locale, { passwordError: '1' });
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(data.newPassword) } });
    return profileRedirect(req, data.locale, { passwordUpdated: '1' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
