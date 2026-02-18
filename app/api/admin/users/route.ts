import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

const schema = z.object({ username: z.string(), email: z.string().email(), name: z.string(), password: z.string(), role: z.enum(['USER', 'ADMIN']).default('USER'), verified: z.string().optional() });

export async function POST(req: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const form = schema.parse(Object.fromEntries(await req.formData()));
  await prisma.user.create({ data: { username: form.username, email: form.email, name: form.name, passwordHash: await hashPassword(form.password), role: form.role, emailVerifiedAt: form.verified ? new Date() : null } });
  return NextResponse.json({ ok: true });
}
