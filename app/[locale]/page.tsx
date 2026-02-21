import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CsrfInput } from '@/components/csrf-input';
import Link from 'next/link';

export default async function Home({ params }: { params: { locale: string } }) {
  const isUr = params.locale === 'ur';
  const user = await getCurrentUser();

  if (user) {
    redirect(`/${params.locale}/app`);
  }

  return (
    <main className="p-4">
      <form className="card mx-auto max-w-md space-y-3" method="post" action="/api/auth/login">
        <CsrfInput />
        <input type="hidden" name="locale" value={params.locale} />
        <h1 className="text-2xl font-semibold">{isUr ? 'زکوٰۃ اسسٹنٹ لاگ اِن' : 'ZakatAssistant Login'}</h1>
        <input className="w-full rounded border p-2" name="identifier" placeholder={isUr ? 'ای میل یا یوزر آئی ڈی' : 'Email or User ID'} required />
        <input className="w-full rounded border p-2" name="password" type="password" placeholder={isUr ? 'پاس ورڈ' : 'Password'} required />
        <button className="w-full rounded bg-brand p-2 text-white">{isUr ? 'لاگ اِن' : 'Login'}</button>
        <Link className="block text-sm text-brand" href={`/${params.locale}/forgot-password`}>
          {isUr ? 'پاس ورڈ بھول گئے؟' : 'Forgot password?'}
        </Link>
      </form>
    </main>
  );
}
