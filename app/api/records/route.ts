import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateZakat } from '@/lib/zakat';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';
import { ensureCategoryStableId, ensureItemStableId } from '@/lib/stable-layout-ids';

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
  const normalizedYearLabel = payload.yearLabel.trim();

  const assets = payload.categories.filter((c) => c.type === 'ASSET');
  const liabilities = payload.categories.filter((c) => c.type === 'LIABILITY');
  const totals = calculateZakat({ calendarType: payload.calendarType, assets, liabilities });

  try {
    const record = await prisma.$transaction(
      async (tx) => {
        const existingForYear = (
          await tx.zakatRecord.findMany({
            where: { userId: user.id },
            select: { id: true, yearLabel: true }
          })
        ).find((entry) => entry.yearLabel.trim() === normalizedYearLabel);
        if (existingForYear) {
          return { duplicateId: existingForYear.id, createdId: null as string | null };
        }

        const created = await tx.zakatRecord.create({
          data: {
            userId: user.id,
            yearLabel: normalizedYearLabel,
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
          const categoryStableId = ensureCategoryStableId(cat, index);
          const category = await tx.category.create({
            data: {
              recordId: created.id,
              type: cat.type,
              nameEn: cat.nameEn,
              nameUr: cat.nameUr,
              sortOrder: index,
              stableId: categoryStableId
            }
          });

          for (const [itemIndex, item] of cat.items.entries()) {
            await tx.lineItem.create({
              data: {
                categoryId: category.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.amount,
                sortOrder: itemIndex,
                stableId: ensureItemStableId(item, categoryStableId, itemIndex)
              }
            });
          }
        }

        return { duplicateId: null as string | null, createdId: created.id };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (record.duplicateId) {
      return NextResponse.redirect(
        new URL(
          `/${payload.locale}/app/records/new?duplicateYear=${encodeURIComponent(normalizedYearLabel)}&existingRecordId=${encodeURIComponent(record.duplicateId)}`,
          req.url
        ),
        303
      );
    }

    return NextResponse.redirect(
      new URL(`/${payload.locale}/app/records/${record.createdId}?year=${encodeURIComponent(normalizedYearLabel)}`, req.url),
      303
    );
  } catch {
    const existingForYear = (
      await prisma.zakatRecord.findMany({
        where: { userId: user.id },
        select: { id: true, yearLabel: true }
      })
    ).find((entry) => entry.yearLabel.trim() === normalizedYearLabel);
    if (existingForYear) {
      return NextResponse.redirect(
        new URL(
          `/${payload.locale}/app/records/new?duplicateYear=${encodeURIComponent(normalizedYearLabel)}&existingRecordId=${encodeURIComponent(existingForYear.id)}`,
          req.url
        ),
        303
      );
    }
    throw new Error('Failed to create record');
  }
}
