import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await prisma.notification.findMany({ where: { OR: [{ recipientUserId: user.id }, { recipientUserId: null }] }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(data);
}
