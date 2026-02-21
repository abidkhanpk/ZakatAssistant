import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function normalizeDatabaseUrl(url?: string) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const sslMode = parsed.searchParams.get('sslmode');
    const useLibpqCompat = parsed.searchParams.get('uselibpqcompat') === 'true';

    // Keep current strict behavior explicit and silence pg v8 deprecation warning.
    if (!useLibpqCompat && (sslMode === 'prefer' || sslMode === 'require' || sslMode === 'verify-ca')) {
      parsed.searchParams.set('sslmode', 'verify-full');
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
const adapter = new PrismaPg({ connectionString: databaseUrl });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
