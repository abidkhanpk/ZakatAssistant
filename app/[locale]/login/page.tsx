import { redirect } from 'next/navigation';

export default function LoginPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') qs.set(key, value);
  }

  const queryString = qs.toString();
  redirect(queryString ? `/${params.locale}?${queryString}` : `/${params.locale}`);
}
