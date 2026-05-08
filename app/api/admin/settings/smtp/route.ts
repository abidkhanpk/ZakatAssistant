import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { getSmtpSettings, sendEmailWithSettings } from '@/lib/smtp';
import { getCurrentUser } from '@/lib/auth';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';

const schema = z.object({
  host: z.string().min(1),
  port: z.coerce.number(),
  security: z.enum(['tls', 'ssl']).optional(),
  secure: z.string().optional(),
  username: z.string().min(1),
  password: z.string().optional(),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  to: z.string().optional(),
  locale: z.string().default('en')
});

async function upsertSetting(key: string, value: string | number | boolean, encrypted = false) {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value, encrypted },
    update: { value, encrypted }
  });
}

function resolveSecurity(data: z.infer<typeof schema>): 'tls' | 'ssl' {
  if (data.security === 'tls' || data.security === 'ssl') return data.security;
  return data.secure ? 'ssl' : 'tls';
}

function redirectWithSmtpError(req: Request, locale: string, code: string, message?: string) {
  const nextUrl = new URL(`/${locale}/admin`, req.url);
  nextUrl.searchParams.set('tab', 'settings');
  nextUrl.searchParams.set('smtpError', code);
  if (message) nextUrl.searchParams.set('smtpErrorMessage', message.slice(0, 220));
  return NextResponse.redirect(nextUrl, 303);
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const rawFormData = await req.formData();
  if (!hasValidCsrfToken(req, rawFormData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const formData = Object.fromEntries(rawFormData);
  const locale = String(formData.locale || 'en');
  const parseResult = schema.safeParse(formData);
  if (!parseResult.success) {
    return redirectWithSmtpError(req, locale, 'invalid-settings');
  }

  const data = parseResult.data;
  const security = resolveSecurity(data);
  const current = await getSmtpSettings();
  const nextPassword = data.password && data.password.trim() ? data.password : current?.password || '';
  if (!nextPassword) {
    return redirectWithSmtpError(req, locale, 'password-required');
  }

  if (url.searchParams.get('test')) {
    const to = (data.to || admin.email || '').trim();
    if (!z.string().email().safeParse(to).success) {
      return redirectWithSmtpError(req, locale, 'invalid-test-recipient');
    }

    try {
      await sendEmailWithSettings(
        {
          host: data.host,
          port: data.port,
          secure: security === 'ssl',
          security,
          username: data.username,
          password: nextPassword,
          fromName: data.fromName,
          fromEmail: data.fromEmail
        },
        to,
        'Zakat Assistant SMTP test',
        'SMTP works'
      );
      return NextResponse.redirect(new URL(`/${locale}/admin?tab=settings&smtpTest=ok`, req.url), 303);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'SMTP test failed';
      const errorCode = /socket close|ECONNRESET|ETIMEDOUT|ESOCKET/i.test(message)
        ? 'smtp-connection-failed'
        : 'smtp-test-failed';
      return redirectWithSmtpError(req, locale, errorCode, message);
    }
  }

  await upsertSetting('smtp.host', data.host);
  await upsertSetting('smtp.port', data.port);
  await upsertSetting('smtp.secure', security === 'ssl');
  await upsertSetting('smtp.security', security);
  await upsertSetting('smtp.username', data.username);
  await upsertSetting('smtp.password', encrypt(nextPassword), true);
  await upsertSetting('smtp.fromName', data.fromName);
  await upsertSetting('smtp.fromEmail', data.fromEmail);

  return NextResponse.redirect(new URL(`/${locale}/admin?tab=settings`, req.url), 303);
}
