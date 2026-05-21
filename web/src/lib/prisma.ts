import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma-next/client";
import { getDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
    ssl: true,
    max: 1,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
