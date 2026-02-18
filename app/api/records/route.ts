import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateZakat } from '@/lib/zakat';

const itemSchema = z.object({ description: z.string(), amount: z.number() });
const categorySchema = z.object({ nameEn: z.string(), type: z.enum(['ASSET', 'LIABILITY']), items: z.array(itemSchema) });
const payloadSchema = z.object({ yearLabel: z.string(), calendarType: z.enum(['ISLAMIC', 'GREGORIAN']), categories: z.array(categorySchema) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = Object.fromEntries(await req.formData());
  const payload = payloadSchema.parse(JSON.parse(String(form.payload)));
  const assets = payload.categories.filter((c) => c.type === 'ASSET');
  const liabilities = payload.categories.filter((c) => c.type === 'LIABILITY');
  const totals = calculateZakat({ calendarType: payload.calendarType, assets, liabilities });

  const record = await prisma.zakatRecord.create({ data: { userId: user.id, yearLabel: payload.yearLabel, calculationDate: new Date(), calendarType: payload.calendarType, zakatRate: totals.zakatRate, totalAssets: totals.totalAssets, totalDeductions: totals.totalDeductions, netZakatable: totals.netZakatable, zakatPayable: totals.zakatPayable, currency: 'PKR' } });
  for (const [index, cat] of payload.categories.entries()) {
    const category = await prisma.category.create({ data: { recordId: record.id, type: cat.type, nameEn: cat.nameEn, nameUr: cat.nameEn, sortOrder: index } });
    for (const [itemIndex, item] of cat.items.entries()) {
      await prisma.lineItem.create({ data: { categoryId: category.id, description: item.description, amount: item.amount, sortOrder: itemIndex } });
    }
  }

  return NextResponse.redirect(new URL(`/en/app/records/${record.id}`, req.url));
}
