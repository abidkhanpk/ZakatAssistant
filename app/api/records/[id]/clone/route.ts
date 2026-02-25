import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateZakat } from '@/lib/zakat';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';
import { ensureCategoryStableId, ensureItemStableId } from '@/lib/stable-layout-ids';

export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const form = Object.fromEntries(formData);
  const locale = String(form.locale || 'en');

  const existing = await prisma.zakatRecord.findFirst({
    where: { id: params.id, userId: user.id },
    include: { categories: { include: { items: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } } }
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const assets = existing.categories
    .filter((c: { type: string }) => c.type === 'ASSET')
    .map((c: { items: { amount: unknown }[] }) => ({ items: c.items.map((i: { amount: unknown }) => ({ amount: Number(i.amount) })) }));
  const liabilities = existing.categories
    .filter((c: { type: string }) => c.type === 'LIABILITY')
    .map((c: { items: { amount: unknown }[] }) => ({ items: c.items.map((i: { amount: unknown }) => ({ amount: Number(i.amount) })) }));

  const totals = calculateZakat({ calendarType: existing.calendarType, assets, liabilities });

  const nextYearLabel = String((Number(existing.yearLabel) || new Date().getFullYear()) + 1).trim();
  const existingForYear = (
    await prisma.zakatRecord.findMany({
      where: { userId: user.id },
      select: { id: true, yearLabel: true }
    })
  ).find((entry) => entry.yearLabel.trim() === nextYearLabel);
  if (existingForYear) {
    return NextResponse.redirect(
      new URL(
        `/${locale}/app/records/new?duplicateYear=${encodeURIComponent(nextYearLabel)}&existingRecordId=${encodeURIComponent(existingForYear.id)}`,
        req.url
      ),
      303
    );
  }

  const clone = await prisma.zakatRecord.create({
    data: {
      userId: user.id,
      yearLabel: nextYearLabel,
      calculationDate: new Date(),
      calendarType: existing.calendarType,
      zakatRate: totals.zakatRate,
      currency: existing.currency,
      totalAssets: totals.totalAssets,
      totalDeductions: totals.totalDeductions,
      netZakatable: totals.netZakatable,
      zakatPayable: totals.zakatPayable,
      clonedFromRecordId: existing.id
    }
  });

  for (const [categoryIndex, category] of existing.categories.entries()) {
    const categoryStableId = ensureCategoryStableId(category, categoryIndex);
    const createdCategory = await prisma.category.create({
      data: {
        recordId: clone.id,
        type: category.type,
        nameEn: category.nameEn,
        nameUr: category.nameUr,
        sortOrder: category.sortOrder,
        stableId: categoryStableId
      }
    });

    for (const [itemIndex, item] of category.items.entries()) {
      await prisma.lineItem.create({
        data: {
          categoryId: createdCategory.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          sortOrder: item.sortOrder,
          stableId: ensureItemStableId(item, categoryStableId, itemIndex)
        }
      });
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/app/records/${clone.id}`, req.url), 303);
}
