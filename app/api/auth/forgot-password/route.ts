import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';
import { randomUUID } from 'crypto';
import { sha256 } from '@/lib/crypto';
import { sendEmail } from '@/lib/smtp';

const schema = z.object({
  email: z.string().email(),
  locale: z.string().default('en')
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const data = schema.parse(Object.fromEntries(formData));

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (user) {
    const token = randomUUID();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60)
      }
    });

    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/${data.locale}/reset-password?token=${token}`;
    try {
      await sendEmail(user.email, 'Reset your password', `<a href="${resetLink}">Reset Password</a>`);
    } catch {
      // Keep the endpoint non-enumerating and resilient when SMTP is unavailable.
    }
  }

  return NextResponse.redirect(new URL(`/${data.locale}/forgot-password?sent=1`, req.url), 303);
}
