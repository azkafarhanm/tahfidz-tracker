import { PrismaPg } from "@prisma/adapter-pg";
import { Resolver } from "node:dns/promises";
import net from "node:net";
import { PrismaClient } from "@/generated/prisma-next/client";
import { getDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const DATABASE_DNS_FALLBACK_SERVERS = ["1.1.1.1", "8.8.8.8"];

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isLocalDatabaseUrl(connectionString: string) {
  try {
    const { hostname } = new URL(connectionString);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function shouldUseDnsFallback(connectionString: string) {
  if (process.env.NODE_ENV === "production" || isLocalDatabaseUrl(connectionString)) {
    return false;
  }

  try {
    return new URL(connectionString).hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

function createDnsFallbackStream() {
  const resolver = new Resolver();
  resolver.setServers(DATABASE_DNS_FALLBACK_SERVERS);

  return () => {
    const socket = new net.Socket();
    const connect = socket.connect.bind(socket);

    socket.connect = ((port: number, host?: string, listener?: () => void) => {
      if (!host) {
        return listener ? connect(port, listener) : connect(port);
      }

      if (net.isIP(host) !== 0) {
        return connect(port, host, listener);
      }

      if (listener) {
        socket.once("connect", listener);
      }

      void resolver.resolve4(host).then(
        ([address]) => {
          if (!address) {
            socket.destroy(new Error(`No IPv4 address found for database host "${host}".`));
            return;
          }

          connect(port, address);
        },
        (error: unknown) => {
          socket.destroy(error instanceof Error ? error : new Error(String(error)));
        },
      );

      return socket;
    }) as typeof socket.connect;

    return socket;
  };
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
    stream: shouldUseDnsFallback(connectionString)
      ? createDnsFallbackStream()
      : undefined,
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
