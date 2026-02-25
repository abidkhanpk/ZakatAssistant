import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NewRecordButton } from '@/components/records/new-record-button';
import { CsrfInput } from '@/components/csrf-input';

export default async function RecordsPage({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);
  const isUr = params.locale === 'ur';

  const records = await prisma.zakatRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  type RecordRow = (typeof records)[number];
  const recordsByYear = [...records].sort((a: RecordRow, b: RecordRow) => {
    const aNum = Number(a.yearLabel);
    const bNum = Number(b.yearLabel);
    if (Number.isFinite(aNum) && Number.isFinite(bNum)) return bNum - aNum;
    if (Number.isFinite(aNum)) return -1;
    if (Number.isFinite(bNum)) return 1;
    return b.yearLabel.localeCompare(a.yearLabel);
  });
  const currentYear = new Date().getFullYear();
  const exactPreviousYearRecord = recordsByYear.find((record: RecordRow) => Number(record.yearLabel) === currentYear - 1);
  const previousYearRecord =
    exactPreviousYearRecord ||
    [...recordsByYear]
      .filter((record: RecordRow) => {
        const n = Number(record.yearLabel);
        return Number.isFinite(n) && n < currentYear;
      })
      .sort((a: RecordRow, b: RecordRow) => Number(b.yearLabel) - Number(a.yearLabel))[0] || recordsByYear[0] || null;

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
              <th className="p-2">{isUr ? 'عمل' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {recordsByYear.map((record: RecordRow) => (
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
                <td className="p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="inline-flex rounded bg-brand px-2 py-1 text-xs font-medium text-white"
                      prefetch={false}
                      href={`/${params.locale}/app/records/new?editRecordId=${record.id}&editYear=${encodeURIComponent(record.yearLabel)}&rev=${record.updatedAt.getTime()}`}
                    >
                      {isUr ? 'ترمیم' : 'Edit'}
                    </Link>
                    <form method="post" action={`/api/records/${record.id}`}>
                      <CsrfInput />
                      <input type="hidden" name="locale" value={params.locale} />
                      <input type="hidden" name="intent" value="delete" />
                      <button
                        type="submit"
                        className="inline-flex rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        {isUr ? 'حذف' : 'Delete'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
