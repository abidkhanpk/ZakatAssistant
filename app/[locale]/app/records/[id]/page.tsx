import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CsrfInput } from '@/components/csrf-input';

export default async function RecordDetails({
  params,
  searchParams
}: {
  params: { id: string; locale: string };
  searchParams: { year?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);

  const record = await prisma.zakatRecord.findFirst({
    where: { id: params.id, userId: user.id },
    include: { categories: { include: { items: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } } }
  });

  if (!record) return <main className="p-4">{params.locale === 'ur' ? 'نہیں ملا' : 'Not found'}</main>;
  if (searchParams.year !== record.yearLabel) {
    redirect(`/${params.locale}/app/records/${record.id}?year=${encodeURIComponent(record.yearLabel)}`);
  }

  const isUr = params.locale === 'ur';

  return (
    <main className="mx-auto max-w-4xl space-y-3 p-4">
      <div className="card">
        <h1 className="text-2xl font-bold">{record.yearLabel}</h1>
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
          <div>
            <p className="text-slate-500">{isUr ? 'کل اثاثے' : 'Total Assets'}</p>
            <p className="font-semibold">{Number(record.totalAssets).toFixed(2)} {record.currency}</p>
          </div>
          <div>
            <p className="text-slate-500">{isUr ? 'کل واجبات' : 'Total Liabilities'}</p>
            <p className="font-semibold">{Number(record.totalDeductions).toFixed(2)} {record.currency}</p>
          </div>
          <div>
            <p className="text-slate-500">{isUr ? 'خالص اثاثے' : 'Net Assets'}</p>
            <p className="font-semibold">{Number(record.netZakatable).toFixed(2)} {record.currency}</p>
          </div>
          <div>
            <p className="text-slate-500">{isUr ? 'زکوٰۃ قابلِ ادا' : 'Zakat Payable'}</p>
            <p className="font-semibold">{Number(record.zakatPayable).toFixed(2)} {record.currency}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            className="inline-block rounded bg-brand px-3 py-2 text-white"
            prefetch={false}
            href={`/${params.locale}/app/records/new?editRecordId=${record.id}&editYear=${encodeURIComponent(record.yearLabel)}&rev=${record.updatedAt.getTime()}`}
          >
            {isUr ? 'ریکارڈ میں ترمیم کریں' : 'Edit record'}
          </Link>
          <form method="post" action={`/api/records/${record.id}`}>
            <CsrfInput />
            <input type="hidden" name="locale" value={params.locale} />
            <input type="hidden" name="intent" value="delete" />
            <button
              type="submit"
              className="inline-block rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 hover:bg-red-100"
            >
              {isUr ? 'ریکارڈ حذف کریں' : 'Delete record'}
            </button>
          </form>
        </div>
      </div>

      {record.categories.map((category: { id: string; nameEn: string; nameUr: string; items: { id: string; description: string; amount: unknown }[] }) => (
        <div key={category.id} className="card overflow-x-auto">
          <h2 className="mb-2 font-semibold">{isUr ? category.nameUr : category.nameEn}</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">{isUr ? 'تفصیل' : 'Description'}</th>
                <th className="p-2">{isUr ? 'رقم' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              {category.items.map((item: { id: string; description: string; amount: unknown }) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{item.description}</td>
                  <td className="p-2">{Number(item.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </main>
  );
}
