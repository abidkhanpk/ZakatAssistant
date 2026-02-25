import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateZakat } from '@/lib/zakat';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';

export const maxDuration = 300;

const itemSchema = z.object({
  stableId: z.string().min(1).optional(),
  description: z.string().min(1),
  amount: z.coerce.number().default(0),
  quantity: z.coerce.number().optional(),
  unitPrice: z.coerce.number().optional()
});

const categorySchema = z.object({
  stableId: z.string().min(1).optional(),
  nameEn: z.string().min(1),
  nameUr: z.string().min(1),
  type: z.enum(['ASSET', 'LIABILITY']),
  items: z.array(itemSchema).min(1)
});

const payloadSchema = z.object({
  locale: z.string().default('en'),
  yearLabel: z.string().min(1),
  calendarType: z.enum(['ISLAMIC', 'GREGORIAN']),
  categories: z.array(categorySchema).min(1)
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const form = Object.fromEntries(formData);
  const rawPayload = JSON.parse(String(form.payload || '{}'));
  const payload = payloadSchema.parse({
    ...rawPayload,
    locale: String(form.locale || rawPayload.locale || 'en')
  });

  const assets = payload.categories.filter((c) => c.type === 'ASSET');
  const liabilities = payload.categories.filter((c) => c.type === 'LIABILITY');
  const totals = calculateZakat({ calendarType: payload.calendarType, assets, liabilities });

  const record = await prisma.zakatRecord.create({
    data: {
      userId: user.id,
      yearLabel: payload.yearLabel,
      calculationDate: new Date(),
      calendarType: payload.calendarType,
      zakatRate: totals.zakatRate,
      totalAssets: totals.totalAssets,
      totalDeductions: totals.totalDeductions,
      netZakatable: totals.netZakatable,
      zakatPayable: totals.zakatPayable,
      currency: 'PKR'
    }
  });

  for (const [index, cat] of payload.categories.entries()) {
    const category = await prisma.category.create({
      data: {
        recordId: record.id,
        type: cat.type,
        nameEn: cat.nameEn,
        nameUr: cat.nameUr,
        sortOrder: index,
        stableId: cat.stableId
      }
    });

    for (const [itemIndex, item] of cat.items.entries()) {
      await prisma.lineItem.create({
        data: {
          categoryId: category.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          sortOrder: itemIndex,
          stableId: item.stableId
        }
      });
    }
  }

  return NextResponse.redirect(
    new URL(`/${payload.locale}/app/records/${record.id}?year=${encodeURIComponent(payload.yearLabel)}`, req.url),
    303
  );
}
