import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CsrfInput } from '@/components/csrf-input';

export default async function AdminUsers({ params }: { params: { locale: string } }) {
  const admin = await getCurrentUser();
  if (!admin) redirect(`/${params.locale}/login`);
  if (admin.role !== 'ADMIN') redirect(`/${params.locale}/app`);

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Admin · Users</h1>

      <form className="card grid gap-2 md:grid-cols-2" method="post" action="/api/admin/users">
        <CsrfInput />
        <input type="hidden" name="action" value="create" />
        <input type="hidden" name="locale" value={params.locale} />
        <input name="username" className="rounded border p-2" placeholder="Username" required />
        <input name="name" className="rounded border p-2" placeholder="Name" required />
        <input name="email" type="email" className="rounded border p-2" placeholder="Email" required />
        <input name="password" type="password" className="rounded border p-2" placeholder="Temp password" required />
        <select name="role" className="rounded border p-2">
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <label className="flex items-center gap-2 rounded border p-2"><input name="verified" type="checkbox" /> Verified</label>
        <button className="rounded bg-brand p-2 text-white md:col-span-2">Create user</button>
      </form>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{user.username}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <div className="text-sm">{user.emailVerifiedAt ? 'Verified' : 'Pending verification'}</div>
            </div>

            <form className="grid gap-2 md:grid-cols-4" method="post" action="/api/admin/users">
              <CsrfInput />
              <input type="hidden" name="action" value="update-meta" />
              <input type="hidden" name="locale" value={params.locale} />
              <input type="hidden" name="userId" value={user.id} />
              <select name="role" className="rounded border p-2" defaultValue={user.role}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <label className="flex items-center gap-2 rounded border p-2"><input name="verified" type="checkbox" defaultChecked={!!user.emailVerifiedAt} /> Verified</label>
              <button className="rounded border p-2">Save role/verification</button>
            </form>

            <form className="grid gap-2 md:grid-cols-4" method="post" action="/api/admin/users">
              <CsrfInput />
              <input type="hidden" name="action" value="reset-password" />
              <input type="hidden" name="locale" value={params.locale} />
              <input type="hidden" name="userId" value={user.id} />
              <input name="newPassword" type="password" className="rounded border p-2 md:col-span-2" placeholder="New password" required minLength={8} />
              <button className="rounded border p-2">Reset password</button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
