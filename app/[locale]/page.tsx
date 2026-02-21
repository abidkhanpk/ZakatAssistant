import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function Home({ params }: { params: { locale: string } }) {
  const t = await getTranslations();
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl card space-y-4">
        <h1 className="text-3xl font-bold">{t('appName')}</h1>
        <p>{t('welcome')}</p>
        <div className="flex gap-3">
          <Link className="rounded-xl bg-brand px-4 py-2 text-white" href={`/${params.locale}/login`}>Login</Link>
          <Link className="rounded-xl border px-4 py-2" href={`/${params.locale}/signup`}>Sign up</Link>
        </div>
      </div>
    </main>
  );
}
