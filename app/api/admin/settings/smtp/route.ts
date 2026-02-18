import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { sendEmail } from '@/lib/smtp';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({ host: z.string(), port: z.coerce.number(), secure: z.string().optional(), username: z.string(), password: z.string(), fromName: z.string(), fromEmail: z.string().email() });

export async function POST(req: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const formData = Object.fromEntries(await req.formData());
  if (url.searchParams.get('test')) {
    await sendEmail(String(formData.to), 'ZakatAssistant SMTP test', 'SMTP works');
    return NextResponse.json({ ok: true });
  }
  const data = schema.parse(formData);
  await prisma.appSetting.upsert({ where: { key: 'smtp' }, create: { key: 'smtp', encrypted: true, value: { ...data, secure: !!data.secure, password: encrypt(data.password) } }, update: { encrypted: true, value: { ...data, secure: !!data.secure, password: encrypt(data.password) } } });
  return NextResponse.redirect(new URL('/en/admin/settings', req.url));
}
