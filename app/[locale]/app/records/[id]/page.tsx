import { prisma } from '@/lib/prisma';

export default async function RecordDetails({ params }: { params: { id: string } }) {
  const record = await prisma.zakatRecord.findUnique({ where: { id: params.id }, include: { categories: { include: { items: true } } } });
  if (!record) return <main className="p-4">Not found</main>;
  return <main className="p-4 space-y-2"><h1 className="text-2xl font-bold">{record.yearLabel}</h1><p>Zakat payable: {record.zakatPayable.toString()}</p></main>;
}
