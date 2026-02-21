import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function UserSettingsPage({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);
  const isUr = params.locale === 'ur';

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="card space-y-2">
        <h1 className="text-2xl font-bold">{isUr ? 'صارف ترتیبات' : 'User settings'}</h1>
        <p>{isUr ? 'مزید ترجیحات یہاں شامل کی جا سکتی ہیں۔' : 'More user preferences can be added here.'}</p>
      </div>
    </main>
  );
}
