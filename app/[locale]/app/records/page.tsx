import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RecordsPage({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);

  const records = await prisma.zakatRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  const formatter = new Intl.NumberFormat(params.locale === 'ur' ? 'ur-PK' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <main className="mx-auto max-w-3xl space-y-3 p-4">
      <Link className="inline-block rounded bg-brand p-2 text-white" href={`/${params.locale}/app/records/new`}>
        New Record
      </Link>
      {records.map((record) => (
        <Link key={record.id} className="card block" href={`/${params.locale}/app/records/${record.id}`}>
          <div className="flex items-center justify-between gap-2">
            <span>{record.yearLabel}</span>
            <span>{formatter.format(Number(record.zakatPayable))}</span>
          </div>
        </Link>
      ))}
    </main>
  );
}
