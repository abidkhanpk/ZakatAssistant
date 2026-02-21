import { redirect } from 'next/navigation';

export default function AdminNotificationsRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/admin?tab=notifications`);
}
