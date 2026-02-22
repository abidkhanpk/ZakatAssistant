import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';
import { randomUUID } from 'crypto';
import { sha256 } from '@/lib/crypto';
import { sendEmail } from '@/lib/smtp';
import { getRequestOrigin } from '@/lib/request-origin';

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

    const resetLink = `${getRequestOrigin(req)}/${data.locale}/reset-password?token=${token}`;
    const body = `
      <p>Hello ${user.name || user.username},</p>
      <p>We received a request to reset your ZakatAssistant password. Click the button below to continue.</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset password</a></p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `;
    try {
      await sendEmail(user.email, 'Reset your password', body);
    } catch {
      // Keep the endpoint non-enumerating and resilient when SMTP is unavailable.
    }
  }

  return NextResponse.redirect(new URL(`/${data.locale}/forgot-password?sent=1`, req.url), 303);
}
