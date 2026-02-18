import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signSession, setAuthCookie } from '@/lib/auth';

const schema = z.object({ email: z.string().email(), password: z.string(), locale: z.string().default('en') });

export async function POST(req: Request) {
  const form = Object.fromEntries(await req.formData());
  const data = schema.parse(form);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.emailVerifiedAt || !(await verifyPassword(user.passwordHash, data.password))) return NextResponse.redirect(new URL(`/${data.locale}/login?error=1`, req.url));
  const token = await signSession(user.id, user.role);
  await setAuthCookie(token);
  return NextResponse.redirect(new URL(`/${data.locale}/app`, req.url));
}
