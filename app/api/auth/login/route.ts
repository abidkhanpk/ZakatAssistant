import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signSession, setAuthCookieOnResponse } from '@/lib/auth';

const schema = z.object({ email: z.string().email(), password: z.string(), locale: z.string().default('en') });

export async function POST(req: Request) {
  try {
    const form = Object.fromEntries(await req.formData());
    const parsed = schema.safeParse(form);
    const locale = parsed.success ? parsed.data.locale : 'en';

    if (!parsed.success) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=1`, req.url), 303);
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !user.emailVerifiedAt) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=1`, req.url), 303);
    }

    let passwordValid = false;
    try {
      passwordValid = await verifyPassword(user.passwordHash, parsed.data.password);
    } catch {
      passwordValid = false;
    }

    if (!passwordValid) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=1`, req.url), 303);
    }

    const token = await signSession(user.id, user.role);
    const response = NextResponse.redirect(new URL(`/${locale}/app`, req.url), 303);
    setAuthCookieOnResponse(response, token);
    return response;
  } catch {
    return NextResponse.redirect(new URL('/en/login?error=1', req.url), 303);
  }
}
