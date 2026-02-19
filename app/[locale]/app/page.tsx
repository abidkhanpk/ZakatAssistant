import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AppHome({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${params.locale}/login`);

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <Link className="card" href={`/${params.locale}/app/records`}>Yearly Records</Link>
        <Link className="card" href={`/${params.locale}/app/notifications`}>Inbox Notifications</Link>
        {user.role === 'ADMIN' ? <Link className="card" href={`/${params.locale}/admin/users`}>Admin Users</Link> : null}
        {user.role === 'ADMIN' ? <Link className="card" href={`/${params.locale}/admin/settings`}>Admin Settings</Link> : null}
        {user.role === 'ADMIN' ? <Link className="card" href={`/${params.locale}/admin/notifications`}>Admin Notifications</Link> : null}
      </div>
    </main>
  );
}
