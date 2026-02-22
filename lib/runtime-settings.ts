import { prisma } from '@/lib/prisma';

export const MIN_RECORDS_MUTATION_TIMEOUT_MS = 5_000;
export const MAX_RECORDS_MUTATION_TIMEOUT_MS = 300_000;
export const DEFAULT_RECORDS_MUTATION_TIMEOUT_MS = 300_000;
const RECORDS_MUTATION_TIMEOUT_KEY = 'runtime.recordsMutationTimeoutMs';

function clampTimeout(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_RECORDS_MUTATION_TIMEOUT_MS;
  return Math.min(MAX_RECORDS_MUTATION_TIMEOUT_MS, Math.max(MIN_RECORDS_MUTATION_TIMEOUT_MS, Math.floor(value)));
}

export async function getRecordMutationTimeoutMs() {
  const row = await prisma.appSetting.findUnique({ where: { key: RECORDS_MUTATION_TIMEOUT_KEY } });
  if (!row) return DEFAULT_RECORDS_MUTATION_TIMEOUT_MS;
  return clampTimeout(Number(row.value));
}

export async function setRecordMutationTimeoutMs(value: number) {
  const timeout = clampTimeout(value);
  await prisma.appSetting.upsert({
    where: { key: RECORDS_MUTATION_TIMEOUT_KEY },
    create: { key: RECORDS_MUTATION_TIMEOUT_KEY, value: timeout },
    update: { value: timeout }
  });
  return timeout;
}
