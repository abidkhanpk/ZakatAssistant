import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RecordsPage({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);
  const records = await prisma.zakatRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return <main className="p-4 space-y-3"><Link className="rounded bg-brand text-white p-2 inline-block" href={`/${params.locale}/app/records/new`}>New Record</Link>{records.map((r) => <Link key={r.id} className="card block" href={`/${params.locale}/app/records/${r.id}`}>{r.yearLabel} — {r.zakatPayable.toString()}</Link>)}</main>;
}
