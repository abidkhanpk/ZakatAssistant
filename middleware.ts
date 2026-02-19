import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const response = handleI18nRouting(req);

  if (!req.cookies.get('csrf_token')) {
    response.cookies.set('csrf_token', crypto.randomUUID(), {
      sameSite: 'lax',
      httpOnly: true
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
