import { cookies } from 'next/headers';
import { NewRecordForm } from '@/components/records/new-record-form';

export default function NewRecordPage({ params }: { params: { locale: string } }) {
  const csrfToken = cookies().get('csrf_token')?.value || '';
  return <NewRecordForm locale={params.locale} csrfToken={csrfToken} />;
}
