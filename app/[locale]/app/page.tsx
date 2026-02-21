import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AppHome({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);
  const isUr = params.locale === 'ur';

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">{isUr ? `خوش آمدید، ${user.name}` : `Welcome, ${user.name}`}</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <Link className="card" href={`/${params.locale}/app/records/new`}>{isUr ? 'نیا زکوٰۃ ریکارڈ' : 'New Zakat Record'}</Link>
        <Link className="card" href={`/${params.locale}/app/records`}>{isUr ? 'سالانہ ریکارڈز' : 'Yearly Records'}</Link>
      </div>
    </main>
  );
}
