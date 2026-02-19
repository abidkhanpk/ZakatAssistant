import { CsrfInput } from '@/components/csrf-input';

export default function ForgotPasswordPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { sent?: string };
}) {
  return (
    <main className="p-4">
      <form className="card mx-auto max-w-md space-y-3" method="post" action="/api/auth/forgot-password">
        <CsrfInput />
        <input type="hidden" name="locale" value={params.locale} />
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="text-sm text-slate-600">Enter your account email. If it exists, we will send a reset link.</p>
        <input className="w-full rounded border p-2" name="email" type="email" placeholder="Email" required />
        <button className="w-full rounded bg-brand p-2 text-white">Send reset link</button>
        {searchParams.sent ? <p className="text-sm text-green-700">If your account exists, a reset email has been sent.</p> : null}
      </form>
    </main>
  );
}
