import { cookies } from 'next/headers';
import { NewRecordForm } from '@/components/records/new-record-form';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { remapImportedCategoriesToCurrentLayout } from '@/lib/record-layout';

export default async function NewRecordPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { editRecordId?: string; importFrom?: string; skipImportPrompt?: string; duplicateYear?: string; existingRecordId?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);

  const csrfToken = cookies().get('csrf_token')?.value || '';
  const editRecordId = searchParams.editRecordId;
  const importFromId = searchParams.importFrom;
  const skipImportPrompt = searchParams.skipImportPrompt === '1';
  const sourceRecordId = editRecordId || importFromId;

  const sourceRecord = sourceRecordId
    ? await prisma.zakatRecord.findFirst({
        where: { id: sourceRecordId, userId: user.id },
        include: { categories: { include: { items: true }, orderBy: { sortOrder: 'asc' } } }
      })
    : null;
  type SourceRecord = NonNullable<typeof sourceRecord>;

  const initialData = sourceRecord
    ? {
        recordId: editRecordId ? sourceRecord.id : undefined,
        yearLabel: editRecordId ? sourceRecord.yearLabel : String(new Date().getFullYear()),
        calendarType: sourceRecord.calendarType,
        categories: (editRecordId
          ? sourceRecord.categories.map((category: SourceRecord['categories'][number]) => ({
              nameEn: category.nameEn,
              nameUr: category.nameUr,
              type: category.type,
              stableId: category.stableId || undefined,
              items: category.items.map((item: SourceRecord['categories'][number]['items'][number]) => ({
                stableId: item.stableId || undefined,
                description: item.description,
                amount: Number(item.amount)
              }))
            }))
          : remapImportedCategoriesToCurrentLayout(
              sourceRecord.categories.map((category: SourceRecord['categories'][number]) => ({
                nameEn: category.nameEn,
                nameUr: category.nameUr,
                type: category.type,
                stableId: category.stableId || undefined,
                items: category.items.map((item: SourceRecord['categories'][number]['items'][number]) => ({
                  stableId: item.stableId || undefined,
                  description: item.description,
                  amount: Number(item.amount)
                }))
              }))
            ))
      }
    : undefined;

  const promptImportFromId =
    !editRecordId && !importFromId && !skipImportPrompt
      ? (
          (
            await prisma.zakatRecord.findFirst({
              where: { userId: user.id, yearLabel: String(new Date().getFullYear() - 1) },
              orderBy: { createdAt: 'desc' },
              select: { id: true }
            })
          ) ||
          (await prisma.zakatRecord.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true }
          }))
        )?.id
      : undefined;
  const existingYearRecords = await prisma.zakatRecord.findMany({
    where: { userId: user.id },
    select: { id: true, yearLabel: true },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <NewRecordForm
      locale={params.locale}
      currentUserId={user.id}
      csrfToken={csrfToken}
      initialData={initialData}
      formAction={editRecordId ? `/api/records/${editRecordId}` : '/api/records'}
      submitLabel={editRecordId ? (params.locale === 'ur' ? 'بند کریں' : 'Close') : undefined}
      promptImportFromId={promptImportFromId}
      duplicateYear={searchParams.duplicateYear}
      existingRecordId={searchParams.existingRecordId}
      existingYearRecords={existingYearRecords}
    />
  );
}
