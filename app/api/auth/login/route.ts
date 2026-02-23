import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signSession, setAuthCookieOnResponse } from '@/lib/auth';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';

const schema = z.object({
  identifier: z.string().min(1),
  password: z.string(),
  locale: z.string().default('en'),
  responseType: z.enum(['redirect', 'json']).optional()
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  let wantsJson = false;
  let locale = 'en';

  try {
    const formData = await req.formData();
    if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

    const form = Object.fromEntries(formData);
    const parsed = schema.safeParse(form);
    locale = parsed.success ? parsed.data.locale : 'en';
    wantsJson = parsed.success ? parsed.data.responseType === 'json' : String(formData.get('responseType') || '') === 'json';

    function invalidCredentialsResponse() {
      if (wantsJson) {
        return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
      }
      return NextResponse.redirect(new URL(`/${locale}/login?error=1`, req.url), 303);
    }

    if (!parsed.success) {
      return invalidCredentialsResponse();
    }

    const identifier = parsed.data.identifier.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }]
      }
    });
    if (!user || !user.emailVerifiedAt) {
      return invalidCredentialsResponse();
    }

    let passwordValid = false;
    try {
      passwordValid = await verifyPassword(user.passwordHash, parsed.data.password);
    } catch {
      passwordValid = false;
    }

    if (!passwordValid) {
      return invalidCredentialsResponse();
    }

    const token = await signSession(user.id, user.role);
    if (wantsJson) {
      const response = NextResponse.json({ ok: true, redirectTo: `/${locale}/app` });
      setAuthCookieOnResponse(response, token);
      return response;
    }

    const response = NextResponse.redirect(new URL(`/${locale}/app`, req.url), 303);
    setAuthCookieOnResponse(response, token);
    return response;
  } catch {
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`/${locale}/login?error=1`, req.url), 303);
  }
}
