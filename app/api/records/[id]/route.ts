import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateZakat } from '@/lib/zakat';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';
import { getRecordMutationTimeoutMs } from '@/lib/runtime-settings';
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

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  const intent = String(formData.get('intent') || '');
  const locale = String(formData.get('locale') || 'en');

  const existing = await prisma.zakatRecord.findFirst({
    where: { id: params.id, userId: user.id }
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (intent === 'delete') {
    await prisma.zakatRecord.delete({
      where: { id: existing.id }
    });
    return NextResponse.redirect(new URL(`/${locale}/app/records`, req.url), 303);
  }

  const form = Object.fromEntries(formData);
  const rawPayload = JSON.parse(String(form.payload || '{}'));
  const payload = payloadSchema.parse({
    ...rawPayload,
    locale: String(form.locale || rawPayload.locale || 'en')
  });
  const normalizedYearLabel = payload.yearLabel.trim();
  const existingForYear = (
    await prisma.zakatRecord.findMany({
      where: {
        userId: user.id,
        id: { not: existing.id }
      },
      select: { id: true, yearLabel: true }
    })
  ).find((entry) => entry.yearLabel.trim() === normalizedYearLabel);
  if (existingForYear) {
    if (intent === 'save' || intent === 'update') {
      return NextResponse.json(
        { error: 'DUPLICATE_YEAR', yearLabel: normalizedYearLabel, existingRecordId: existingForYear.id },
        { status: 409 }
      );
    }
    return NextResponse.redirect(
      new URL(
        `/${payload.locale}/app/records/new?editRecordId=${existing.id}&duplicateYear=${encodeURIComponent(normalizedYearLabel)}&existingRecordId=${encodeURIComponent(existingForYear.id)}`,
        req.url
      ),
      303
    );
  }

  const assets = payload.categories.filter((c) => c.type === 'ASSET');
  const liabilities = payload.categories.filter((c) => c.type === 'LIABILITY');
  const totals = calculateZakat({ calendarType: payload.calendarType, assets, liabilities });
  const transactionTimeoutMs = await getRecordMutationTimeoutMs();

  const txResult = await prisma.$transaction(async (tx) => {
    const conflict = (
      await tx.zakatRecord.findMany({
        where: { userId: user.id, id: { not: existing.id } },
        select: { id: true, yearLabel: true }
      })
    ).find((entry) => entry.yearLabel.trim() === normalizedYearLabel);
    if (conflict) {
      throw new Error(`DUPLICATE_YEAR:${conflict.id}`);
    }

    await tx.zakatRecord.update({
      where: { id: existing.id },
      data: {
        yearLabel: normalizedYearLabel,
        calculationDate: new Date(),
        calendarType: payload.calendarType,
        zakatRate: totals.zakatRate,
        totalAssets: totals.totalAssets,
        totalDeductions: totals.totalDeductions,
        netZakatable: totals.netZakatable,
        zakatPayable: totals.zakatPayable
      }
    });

    await tx.category.deleteMany({
      where: { recordId: existing.id }
    });

    for (const [index, cat] of payload.categories.entries()) {
      const categoryStableId = ensureCategoryStableId(cat, index);
      const category = await tx.category.create({
        data: {
          recordId: existing.id,
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
  }, { timeout: transactionTimeoutMs, isolationLevel: Prisma.TransactionIsolationLevel.Serializable }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('DUPLICATE_YEAR:')) {
      const duplicateId = message.slice('DUPLICATE_YEAR:'.length);
      if (intent === 'save' || intent === 'update') {
        return NextResponse.json(
          { error: 'DUPLICATE_YEAR', yearLabel: normalizedYearLabel, existingRecordId: duplicateId },
          { status: 409 }
        );
      }
      return NextResponse.redirect(
        new URL(
          `/${payload.locale}/app/records/new?editRecordId=${existing.id}&duplicateYear=${encodeURIComponent(normalizedYearLabel)}&existingRecordId=${encodeURIComponent(duplicateId)}`,
          req.url
        ),
        303
      );
    }
    throw error;
  });

  if (txResult instanceof NextResponse) return txResult;

  revalidatePath(`/${payload.locale}/app/records`);
  revalidatePath(`/${payload.locale}/app/records/${existing.id}`);
  revalidatePath(`/${payload.locale}/app/records/new`);

  if (intent === 'save') {
    return NextResponse.json({ ok: true, recordId: existing.id });
  }

  return NextResponse.redirect(
    new URL(`/${payload.locale}/app/records/${existing.id}?year=${encodeURIComponent(normalizedYearLabel)}`, req.url),
    303
  );
}
