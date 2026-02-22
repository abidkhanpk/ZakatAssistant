import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { prisma } from './prisma';
import type { NextResponse } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');
const appUrl = process.env.APP_URL || '';
const shouldUseSecureCookies = process.env.COOKIE_SECURE === 'true' || appUrl.startsWith('https://');
const scrypt = promisify(scryptCallback);
const SCRYPT_PREFIX = 'scrypt';

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${SCRYPT_PREFIX}$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(hash: string, password: string) {
  const parts = hash.split('$');
  if (parts.length !== 3 || parts[0] !== SCRYPT_PREFIX) return false;

  const [, salt, storedHex] = parts;
  const storedKey = Buffer.from(storedHex, 'hex');
  const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;
  return timingSafeEqual(storedKey, derivedKey);
}

export async function signSession(userId: string, role: string) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: shouldUseSecureCookies,
  path: '/'
};

export function setAuthCookieOnResponse(response: NextResponse, token: string) {
  response.cookies.set('za_session', token, authCookieOptions);
}

export async function setAuthCookie(token: string) {
  cookies().set('za_session', token, authCookieOptions);
}

export function clearAuthCookie() {
  cookies().set('za_session', '', { expires: new Date(0), path: '/' });
}

export async function getCurrentUser() {
  const token = cookies().get('za_session')?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secret);
    return prisma.user.findUnique({ where: { id: verified.payload.sub! } });
  } catch {
    return null;
  }
}
