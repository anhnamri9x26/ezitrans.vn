import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaInstance = globalForPrisma.prisma as any;
if (prismaInstance && (
  !('pageRevision' in prismaInstance) || 
  !('aiUsageLog' in prismaInstance) || 
  !('formSubmission' in prismaInstance) ||
  !('userSession' in prismaInstance) ||
  !('passwordReset' in prismaInstance) ||
  !('securityIpRule' in prismaInstance) ||
  !('securityEvent' in prismaInstance) ||
  !('securityScan' in prismaInstance) ||
  !('securityFinding' in prismaInstance) ||
  !('fileIntegritySnapshot' in prismaInstance) ||
  !('productMeta' in prismaInstance)
)) {
  console.log('Clearing cached global prisma client to load new models (including productMeta)...');
  try {
    prismaInstance.$disconnect();
  } catch (err) {}
  delete globalForPrisma.prisma;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

