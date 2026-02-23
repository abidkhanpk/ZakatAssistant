import { CsrfInput } from '@/components/csrf-input';

export default function SignupPage({ params }: { params: { locale: string } }) {
  return (
    <main className="p-4">
      <form className="card mx-auto max-w-md space-y-3" method="post" action="/api/auth/signup">
        <CsrfInput />
        <input type="hidden" name="locale" value={params.locale} />
        <h1 className="text-2xl font-semibold text-center">Create account</h1>
        <input className="w-full rounded border p-2" name="username" placeholder="Username" required />
        <input className="w-full rounded border p-2" name="name" placeholder="Name" required />
        <input className="w-full rounded border p-2" name="email" type="email" placeholder="Email" required />
        <input className="w-full rounded border p-2" name="password" type="password" placeholder="Password" required />
        <button className="w-full rounded bg-brand p-2 text-white">Sign up</button>
      </form>
    </main>
  );
}
