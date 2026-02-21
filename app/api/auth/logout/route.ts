import { NextResponse } from 'next/server';
import { hasValidCsrfToken } from '@/lib/csrf';
import { isSameOrigin } from '@/lib/security';

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const locale = String(formData.get('locale') || 'en');
  const response = NextResponse.redirect(new URL(`/${locale}/login`, req.url), 303);
  response.cookies.set('za_session', '', { expires: new Date(0), path: '/' });
  return response;
}
