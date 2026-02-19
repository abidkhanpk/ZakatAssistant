import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { randomUUID } from 'crypto';
import { sha256 } from '@/lib/crypto';
import { sendEmail } from '@/lib/smtp';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';

const schema = z.object({
  username: z.string().min(3),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  locale: z.string().default('en')
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const form = Object.fromEntries(formData);
  const data = schema.parse(form);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password)
    }
  });

  const token = randomUUID();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }
  });

  const link = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify?locale=${data.locale}&token=${token}`;
  try {
    await sendEmail(user.email, 'Verify your email', `<a href="${link}">Verify Email</a>`);
  } catch {
    // Keep signup successful even if SMTP is not configured yet.
  }

  return NextResponse.redirect(new URL(`/${data.locale}/verify-email`, req.url), 303);
}
