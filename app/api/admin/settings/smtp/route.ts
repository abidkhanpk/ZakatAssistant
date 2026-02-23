import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { getSmtpSettings, sendEmail } from '@/lib/smtp';
import { getCurrentUser } from '@/lib/auth';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';

const schema = z.object({
  host: z.string().min(1),
  port: z.coerce.number(),
  secure: z.string().optional(),
  username: z.string().min(1),
  password: z.string().optional(),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  locale: z.string().default('en')
});

async function upsertSetting(key: string, value: string | number | boolean, encrypted = false) {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value, encrypted },
    update: { value, encrypted }
  });
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

  if (url.searchParams.get('test')) {
    try {
      await sendEmail(String(formData.to || ''), 'Zakat Assistant SMTP test', 'SMTP works');
      return NextResponse.redirect(new URL(`/${locale}/admin?tab=settings&smtpTest=ok`, req.url), 303);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'SMTP test failed';
      const errorCode = /socket close|ECONNRESET|ETIMEDOUT|ESOCKET/i.test(message)
        ? 'smtp-connection-failed'
        : 'smtp-test-failed';
      return NextResponse.redirect(new URL(`/${locale}/admin?tab=settings&smtpError=${errorCode}`, req.url), 303);
    }
  }

  const data = schema.parse(formData);
  const current = await getSmtpSettings();
  const nextPassword = data.password && data.password.trim() ? data.password : current?.password || '';
  if (!nextPassword) {
    return NextResponse.redirect(new URL(`/${locale}/admin?tab=settings&smtpError=password-required`, req.url), 303);
  }

  await upsertSetting('smtp.host', data.host);
  await upsertSetting('smtp.port', data.port);
  await upsertSetting('smtp.secure', !!data.secure);
  await upsertSetting('smtp.username', data.username);
  await upsertSetting('smtp.password', encrypt(nextPassword), true);
  await upsertSetting('smtp.fromName', data.fromName);
  await upsertSetting('smtp.fromEmail', data.fromEmail);

  return NextResponse.redirect(new URL(`/${locale}/admin?tab=settings`, req.url), 303);
}
