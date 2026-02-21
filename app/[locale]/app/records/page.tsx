import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RecordsPage({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);
  const isUr = params.locale === 'ur';

  const records = await prisma.zakatRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  const formatter = new Intl.NumberFormat(params.locale === 'ur' ? 'ur-PK' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <main className="mx-auto max-w-4xl space-y-3 p-4">
      <Link className="inline-block rounded bg-brand p-2 text-white" href={`/${params.locale}/app/records/new`}>
        {isUr ? 'نیا ریکارڈ' : 'New Record'}
      </Link>
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">{isUr ? 'سال' : 'Year'}</th>
              <th className="p-2">{isUr ? 'زکوٰۃ قابلِ ادا' : 'Zakat Payable'}</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record: { id: string; yearLabel: string; zakatPayable: unknown }) => (
              <tr key={record.id} className="border-b hover:bg-slate-50">
                <td className="p-2">
                  <Link className="text-brand underline" href={`/${params.locale}/app/records/${record.id}`}>
                    {record.yearLabel}
                  </Link>
                </td>
                <td className="p-2">{formatter.format(Number(record.zakatPayable))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
