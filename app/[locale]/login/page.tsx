import Link from 'next/link';
import { CsrfInput } from '@/components/csrf-input';

export default function LoginPage({ params }: { params: { locale: string } }) {
  return (
    <main className="p-4">
      <form className="card mx-auto max-w-md space-y-3" method="post" action="/api/auth/login">
        <CsrfInput />
        <input type="hidden" name="locale" value={params.locale} />
        <h1 className="text-2xl font-semibold">ZakatAssistant Login</h1>
        <input className="w-full rounded border p-2" name="email" placeholder="Email" required />
        <input className="w-full rounded border p-2" name="password" type="password" placeholder="Password" required />
        <button className="w-full rounded bg-brand p-2 text-white">Login</button>
        <Link className="block text-sm text-brand" href={`/${params.locale}/forgot-password`}>
          Forgot password?
        </Link>
      </form>
    </main>
  );
}
