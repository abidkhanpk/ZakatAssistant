import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signSession, setAuthCookieOnResponse } from '@/lib/auth';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';

const schema = z.object({ email: z.string().email(), password: z.string(), locale: z.string().default('en') });

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  try {
    const formData = await req.formData();
    if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

    const form = Object.fromEntries(formData);
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
