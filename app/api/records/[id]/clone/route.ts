import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateZakat } from '@/lib/zakat';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const existing = await prisma.zakatRecord.findUnique({ where: { id: params.id }, include: { categories: { include: { items: true } } } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const assets = existing.categories.filter((c) => c.type === 'ASSET').map((c) => ({ items: c.items.map((i) => ({ amount: Number(i.amount) })) }));
  const liabilities = existing.categories.filter((c) => c.type === 'LIABILITY').map((c) => ({ items: c.items.map((i) => ({ amount: Number(i.amount) })) }));
  const totals = calculateZakat({ calendarType: existing.calendarType, assets, liabilities });
  const clone = await prisma.zakatRecord.create({ data: { userId: user.id, yearLabel: `${Number(existing.yearLabel) + 1}`, calculationDate: new Date(), calendarType: existing.calendarType, zakatRate: totals.zakatRate, currency: existing.currency, totalAssets: totals.totalAssets, totalDeductions: totals.totalDeductions, netZakatable: totals.netZakatable, zakatPayable: totals.zakatPayable, clonedFromRecordId: existing.id } });
  return NextResponse.json({ id: clone.id });
}
