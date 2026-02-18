import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next();
  if (!/^\/(en|ur)(\/|$)/.test(pathname)) {
    return NextResponse.redirect(new URL(`/en${pathname}`, req.url));
  }
  const response = NextResponse.next();
  if (!req.cookies.get('csrf_token')) {
    response.cookies.set('csrf_token', crypto.randomUUID(), { sameSite: 'lax', httpOnly: true });
  }
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
