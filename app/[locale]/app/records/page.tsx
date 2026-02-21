import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NewRecordButton } from '@/components/records/new-record-button';

export default async function RecordsPage({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);
  const isUr = params.locale === 'ur';

  const records = await prisma.zakatRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  type RecordRow = (typeof records)[number];
  const currentYear = new Date().getFullYear();
  const exactPreviousYearRecord = records.find((record: RecordRow) => Number(record.yearLabel) === currentYear - 1);
  const previousYearRecord =
    exactPreviousYearRecord ||
    [...records]
      .filter((record: RecordRow) => {
        const n = Number(record.yearLabel);
        return Number.isFinite(n) && n < currentYear;
      })
      .sort((a: RecordRow, b: RecordRow) => Number(b.yearLabel) - Number(a.yearLabel))[0] || records[0] || null;

  const formatter = new Intl.NumberFormat(params.locale === 'ur' ? 'ur-PK' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <main className="mx-auto max-w-4xl space-y-3 p-4">
      <NewRecordButton
        locale={params.locale}
        hasPreviousRecord={Boolean(previousYearRecord)}
        importHref={`/${params.locale}/app/records/new?importFrom=${previousYearRecord?.id || ''}`}
        startFreshHref={`/${params.locale}/app/records/new?skipImportPrompt=1`}
      />
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">{isUr ? 'سال' : 'Year'}</th>
              <th className="p-2">{isUr ? 'کل اثاثے' : 'Total Assets'}</th>
              <th className="p-2">{isUr ? 'کل واجبات' : 'Total Liabilities'}</th>
              <th className="p-2">{isUr ? 'خالص اثاثے' : 'Net Assets'}</th>
              <th className="p-2">{isUr ? 'زکوٰۃ قابلِ ادا' : 'Zakat Payable'}</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record: RecordRow) => (
              <tr key={record.id} className="border-b hover:bg-slate-50">
                <td className="p-2">
                  <Link className="text-brand underline" href={`/${params.locale}/app/records/${record.id}?year=${encodeURIComponent(record.yearLabel)}`}>
                    {record.yearLabel}
                  </Link>
                </td>
                <td className="p-2">{formatter.format(Number(record.totalAssets))}</td>
                <td className="p-2">{formatter.format(Number(record.totalDeductions))}</td>
                <td className="p-2">{formatter.format(Number(record.netZakatable))}</td>
                <td className="p-2">{formatter.format(Number(record.zakatPayable))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
