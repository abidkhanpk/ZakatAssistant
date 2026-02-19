import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import argon2 from 'argon2';
import { prisma } from './prisma';
import type { NextResponse } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
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
  secure: process.env.NODE_ENV === 'production',
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
