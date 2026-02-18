import { prisma } from '@/lib/prisma';

export default async function AdminUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return <main className="p-4 space-y-2"><h1 className="text-2xl font-bold">Admin · Users</h1>{users.map((u)=><div key={u.id} className="card">{u.username} · {u.role} · {u.emailVerifiedAt ? 'Verified' : 'Pending'}</div>)}</main>;
}
