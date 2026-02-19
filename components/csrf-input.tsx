import { cookies } from 'next/headers';

export function CsrfInput() {
  const token = cookies().get('csrf_token')?.value || '';
  return <input type="hidden" name="csrfToken" value={token} />;
}
