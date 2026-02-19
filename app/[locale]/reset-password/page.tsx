import { CsrfInput } from '@/components/csrf-input';

export default function ResetPasswordPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { token?: string; expired?: string; error?: string };
}) {
  const token = searchParams.token || '';

  return (
    <main className="p-4">
      <form className="card mx-auto max-w-md space-y-3" method="post" action="/api/auth/reset-password">
        <CsrfInput />
        <input type="hidden" name="locale" value={params.locale} />
        <input type="hidden" name="token" value={token} />
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <input className="w-full rounded border p-2" name="password" type="password" minLength={8} placeholder="New password" required />
        <input className="w-full rounded border p-2" name="confirmPassword" type="password" minLength={8} placeholder="Confirm password" required />
        <button className="w-full rounded bg-brand p-2 text-white" disabled={!token}>Reset password</button>
        {searchParams.expired ? <p className="text-sm text-red-700">This reset link is invalid or expired.</p> : null}
        {searchParams.error ? <p className="text-sm text-red-700">Passwords do not match.</p> : null}
      </form>
    </main>
  );
}
