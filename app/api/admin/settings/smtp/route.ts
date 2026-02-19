import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { sendEmail } from '@/lib/smtp';
import { getCurrentUser } from '@/lib/auth';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';

const schema = z.object({
  host: z.string().min(1),
  port: z.coerce.number(),
  secure: z.string().optional(),
  username: z.string().min(1),
  password: z.string().min(1),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  locale: z.string().default('en')
});

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
    await sendEmail(String(formData.to || ''), 'ZakatAssistant SMTP test', 'SMTP works');
    return NextResponse.redirect(new URL(`/${locale}/admin/settings`, req.url), 303);
  }

  const data = schema.parse(formData);
  const { locale: _locale, ...smtpData } = data;
  await prisma.appSetting.upsert({
    where: { key: 'smtp' },
    create: {
      key: 'smtp',
      encrypted: true,
      value: {
        ...smtpData,
        secure: !!smtpData.secure,
        password: encrypt(smtpData.password)
      }
    },
    update: {
      encrypted: true,
      value: {
        ...smtpData,
        secure: !!smtpData.secure,
        password: encrypt(smtpData.password)
      }
    }
  });

  return NextResponse.redirect(new URL(`/${locale}/admin/settings`, req.url), 303);
}
