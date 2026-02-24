import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BookOpenText, PlusCircle } from 'lucide-react';
import { YearlyMetricsDashboard } from '@/components/dashboard/yearly-metrics-dashboard';

export default async function AppHome({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);
  const isUr = params.locale === 'ur';
  const records = await prisma.zakatRecord.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    select: {
      yearLabel: true,
      totalAssets: true,
      totalDeductions: true,
      netZakatable: true,
      zakatPayable: true
    }
  });
  const chartPoints = records.map((record: (typeof records)[number]) => ({
    yearLabel: record.yearLabel,
    totalAssets: Number(record.totalAssets),
    totalDeductions: Number(record.totalDeductions),
    netZakatable: Number(record.netZakatable),
    zakatPayable: Number(record.zakatPayable)
  })).sort((a, b) => {
    const aNum = Number(a.yearLabel);
    const bNum = Number(b.yearLabel);
    if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
    if (Number.isFinite(aNum)) return -1;
    if (Number.isFinite(bNum)) return 1;
    return a.yearLabel.localeCompare(b.yearLabel);
  });

  return (
    <main className="space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">{isUr ? `خوش آمدید، ${user.name}` : `Welcome, ${user.name}`}</h1>
        <div className="flex flex-wrap justify-end gap-2">
          <Link className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition hover:border-brand/40 hover:text-brand" href={`/${params.locale}/app/records/new`}>
            <PlusCircle size={16} />
            {isUr ? 'نیا ریکارڈ' : 'New Record'}
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition hover:border-brand/40 hover:text-brand" href={`/${params.locale}/app/records`}>
            <BookOpenText size={16} />
            {isUr ? 'سابقہ ریکارڈز' : 'Previous Records'}
          </Link>
        </div>
      </div>
      <YearlyMetricsDashboard locale={params.locale} points={chartPoints} />
    </main>
  );
}
