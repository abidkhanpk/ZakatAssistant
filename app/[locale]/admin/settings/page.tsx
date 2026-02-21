import { redirect } from 'next/navigation';

export default function AdminSettingsRedirect({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { smtpError?: string; smtpTest?: string };
}) {
  const qs = new URLSearchParams();
  qs.set('tab', 'settings');
  if (searchParams.smtpError) qs.set('smtpError', searchParams.smtpError);
  if (searchParams.smtpTest) qs.set('smtpTest', searchParams.smtpTest);
  redirect(`/${params.locale}/admin?${qs.toString()}`);
}
