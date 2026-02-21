import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CsrfInput } from '@/components/csrf-input';

export default async function RecordDetails({ params }: { params: { id: string; locale: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);

  const record = await prisma.zakatRecord.findFirst({
    where: { id: params.id, userId: user.id },
    include: { categories: { include: { items: true }, orderBy: { sortOrder: 'asc' } } }
  });

  if (!record) return <main className="p-4">Not found</main>;

  const isUr = params.locale === 'ur';

  return (
    <main className="mx-auto max-w-4xl space-y-3 p-4">
      <div className="card">
        <h1 className="text-2xl font-bold">{record.yearLabel}</h1>
        <p className="mt-1 text-sm text-slate-600">Zakat payable: {Number(record.zakatPayable).toFixed(2)} {record.currency}</p>
        <form className="mt-3" method="post" action={`/api/records/${record.id}/clone`}>
          <CsrfInput />
          <input type="hidden" name="locale" value={params.locale} />
          <button className="rounded bg-brand px-3 py-2 text-white">Clone to next year</button>
        </form>
      </div>

      {record.categories.map((category: { id: string; nameEn: string; nameUr: string; items: { id: string; description: string; amount: unknown }[] }) => (
        <div key={category.id} className="card">
          <h2 className="font-semibold">{isUr ? category.nameUr : category.nameEn}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {category.items.map((item: { id: string; description: string; amount: unknown }) => (
              <li key={item.id} className="flex items-center justify-between">
                <span>{item.description}</span>
                <span>{Number(item.amount).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </main>
  );
}
