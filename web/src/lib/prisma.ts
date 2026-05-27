import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma-next/client";
import { getDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function createPrismaClient() {
  const connectionString = getDatabaseUrl();
  const ssl = !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");
  const maxConnections = readPositiveInt(
    process.env.DATABASE_POOL_MAX,
    process.env.NODE_ENV === "production" ? 10 : 5,
  );
  const adapter = new PrismaPg({
    connectionString,
    ssl,
    max: maxConnections,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
