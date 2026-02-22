import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function normalizeDatabaseUrl(url?: string) {
  if (!url) return '';
  const trimmed = url.trim().replace(/^['"]|['"]$/g, '');
  try {
    const parsed = new URL(trimmed);
    const sslMode = parsed.searchParams.get('sslmode');
    const useLibpqCompat = parsed.searchParams.get('uselibpqcompat') === 'true';

    // Keep current strict behavior explicit and silence pg v8 deprecation warning.
    if (!useLibpqCompat && (sslMode === 'prefer' || sslMode === 'require' || sslMode === 'verify-ca')) {
      parsed.searchParams.set('sslmode', 'verify-full');
    }

    return parsed.toString();
  } catch {
    return trimmed;
  }
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
let adapter: PrismaPg | undefined;
if (databaseUrl) {
  try {
    adapter = new PrismaPg({ connectionString: databaseUrl });
  } catch {
    adapter = undefined;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    adapter
      ? {
          adapter
        }
      : undefined
  );
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
