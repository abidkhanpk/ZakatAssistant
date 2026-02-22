import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { isSameOrigin } from '@/lib/security';
import { hasValidCsrfToken } from '@/lib/csrf';
import { MAX_RECORDS_MUTATION_TIMEOUT_MS, MIN_RECORDS_MUTATION_TIMEOUT_MS, setRecordMutationTimeoutMs } from '@/lib/runtime-settings';

const schema = z.object({
  locale: z.string().default('en'),
  recordsMutationTimeoutMs: z.coerce.number().int().min(MIN_RECORDS_MUTATION_TIMEOUT_MS).max(MAX_RECORDS_MUTATION_TIMEOUT_MS)
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await req.formData();
  if (!hasValidCsrfToken(req, formData)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const parsed = schema.safeParse(Object.fromEntries(formData));
  const locale = String(formData.get('locale') || 'en');
  if (!parsed.success) {
    return NextResponse.redirect(new URL(`/${locale}/admin?tab=settings&runtimeError=invalid-timeout`, req.url), 303);
  }

  await setRecordMutationTimeoutMs(parsed.data.recordsMutationTimeoutMs);
  return NextResponse.redirect(new URL(`/${parsed.data.locale}/admin?tab=settings&runtimeSaved=1`, req.url), 303);
}
