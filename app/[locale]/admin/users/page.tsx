import { redirect } from 'next/navigation';

export default function AdminUsersRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/admin?tab=users`);
}
