import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateZakat } from '@/lib/zakat';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';
import { ensureCategoryStableId, ensureItemStableId } from '@/lib/stable-layout-ids';
import { getRecordMutationTimeoutMs } from '@/lib/runtime-settings';

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
  const intent = String(formData.get('intent') || '');
  let payload: z.infer<typeof payloadSchema> | null = null;
  let normalizedYearLabel = '';

  try {
    const form = Object.fromEntries(formData);
    const rawPayload = JSON.parse(String(form.payload || '{}'));
    const parsedPayload = payloadSchema.parse({
      ...rawPayload,
      locale: String(form.locale || rawPayload.locale || 'en')
    });
    payload = parsedPayload;
    normalizedYearLabel = parsedPayload.yearLabel.trim();

    const assets = parsedPayload.categories.filter((c) => c.type === 'ASSET');
    const liabilities = parsedPayload.categories.filter((c) => c.type === 'LIABILITY');
    const totals = calculateZakat({ calendarType: parsedPayload.calendarType, assets, liabilities });
    const transactionTimeoutMs = await getRecordMutationTimeoutMs();

    const record = await prisma.$transaction(async (tx) => {
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
            calendarType: parsedPayload.calendarType,
            zakatRate: totals.zakatRate,
            totalAssets: totals.totalAssets,
            totalDeductions: totals.totalDeductions,
            netZakatable: totals.netZakatable,
            zakatPayable: totals.zakatPayable,
            currency: 'PKR'
          }
        });

        for (const [index, cat] of parsedPayload.categories.entries()) {
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
      }, { timeout: transactionTimeoutMs });

    if (record.duplicateId) {
      if (intent === 'save') {
        return NextResponse.json(
          { error: 'DUPLICATE_YEAR', yearLabel: normalizedYearLabel, existingRecordId: record.duplicateId },
          { status: 409 }
        );
      }
      return NextResponse.redirect(
        new URL(
          `/${parsedPayload.locale}/app/records/new?duplicateYear=${encodeURIComponent(normalizedYearLabel)}&existingRecordId=${encodeURIComponent(record.duplicateId)}`,
          req.url
        ),
        303
      );
    }

    if (intent === 'save') {
      return NextResponse.json({ ok: true, recordId: record.createdId, yearLabel: normalizedYearLabel });
    }
    return NextResponse.redirect(
      new URL(`/${parsedPayload.locale}/app/records/${record.createdId}?year=${encodeURIComponent(normalizedYearLabel)}`, req.url),
      303
    );
  } catch (error) {
    if (intent === 'save') {
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
      }
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
      }
      const details = process.env.NODE_ENV !== 'production' && error instanceof Error ? error.message : undefined;
      return NextResponse.json({ error: 'CREATE_FAILED', details }, { status: 500 });
    }
    if (!payload) {
      throw error;
    }
    const existingForYear = (
      await prisma.zakatRecord.findMany({
        where: { userId: user.id },
        select: { id: true, yearLabel: true }
      })
    ).find((entry) => entry.yearLabel.trim() === normalizedYearLabel);
    if (existingForYear) {
      if (intent === 'save') {
        return NextResponse.json(
          { error: 'DUPLICATE_YEAR', yearLabel: normalizedYearLabel, existingRecordId: existingForYear.id },
          { status: 409 }
        );
      }
      return NextResponse.redirect(
        new URL(
          `/${payload.locale}/app/records/new?duplicateYear=${encodeURIComponent(normalizedYearLabel || payload.yearLabel)}&existingRecordId=${encodeURIComponent(existingForYear.id)}`,
          req.url
        ),
        303
      );
    }
    throw error;
  }
}
