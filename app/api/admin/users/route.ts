import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';

const createSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  verified: z.string().optional(),
  locale: z.string().default('en')
});

const updateFullSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(3),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN']),
  verified: z.string().optional(),
  newPassword: z.string().optional(),
  locale: z.string().default('en')
});

const deleteSchema = z.object({
  userId: z.string().min(1),
  locale: z.string().default('en')
});

function usersRedirect(req: Request, locale: string, userError?: string) {
  const url = new URL(`/${locale}/admin?tab=users`, req.url);
  if (userError) url.searchParams.set('userError', userError);
  return NextResponse.redirect(url, 303);
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const form = Object.fromEntries(formData);
  const explicitAction = typeof form.action === 'string' ? form.action : '';
  const action = explicitAction || (typeof form.userId === 'string' && form.userId ? 'update-full' : 'create');
  const locale = typeof form.locale === 'string' && form.locale ? form.locale : 'en';

  try {
    if (action === 'create') {
      const data = createSchema.parse(form);
      await prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          name: data.name,
          passwordHash: await hashPassword(data.password),
          role: data.role,
          emailVerifiedAt: data.verified ? new Date() : null
        }
      });
      return usersRedirect(req, data.locale);
    }

    if (action === 'update-full') {
      const data = updateFullSchema.parse(form);
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          username: data.username,
          name: data.name,
          email: data.email,
          role: data.role,
          emailVerifiedAt: data.verified ? new Date() : null,
          ...(data.newPassword ? { passwordHash: await hashPassword(data.newPassword) } : {})
        }
      });
      return usersRedirect(req, data.locale);
    }

    if (action === 'delete') {
      const data = deleteSchema.parse(form);
      if (data.userId === admin.id) {
        return usersRedirect(req, data.locale);
      }

      const target = await prisma.user.findUnique({ where: { id: data.userId }, select: { role: true } });
      if (!target) {
        return usersRedirect(req, data.locale);
      }

      if (target.role === 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          return usersRedirect(req, data.locale);
        }
      }

      await prisma.user.delete({ where: { id: data.userId } });
      return usersRedirect(req, data.locale);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return usersRedirect(req, locale, 'invalid-input');
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : '';
        if (target.includes('email')) return usersRedirect(req, locale, 'email-taken');
        if (target.includes('username')) return usersRedirect(req, locale, 'username-taken');
        return usersRedirect(req, locale, 'duplicate');
      }
      if (error.code === 'P2025') {
        return usersRedirect(req, locale, 'not-found');
      }
    }

    console.error('Admin users route failed', error);
    return usersRedirect(req, locale, 'unexpected');
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
