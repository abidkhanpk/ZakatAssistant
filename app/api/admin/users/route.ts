import { NextResponse } from 'next/server';
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

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const form = Object.fromEntries(formData);
  const action = String(form.action || 'create');

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
    return NextResponse.redirect(new URL(`/${data.locale}/admin?tab=users`, req.url), 303);
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
    return NextResponse.redirect(new URL(`/${data.locale}/admin?tab=users`, req.url), 303);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
