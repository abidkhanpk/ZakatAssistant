import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { LoginForm } from '@/components/login-form';

export default async function Home({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { error?: string };
}) {
  const user = await getCurrentUser();
  const hasLoginError = searchParams.error === '1';
  const csrfToken = cookies().get('csrf_token')?.value || '';

  if (user) {
    redirect(`/${params.locale}/app`);
  }

  return (
    <main className="p-4">
      <LoginForm locale={params.locale} csrfToken={csrfToken} initialError={hasLoginError} />
    </main>
  );
}
