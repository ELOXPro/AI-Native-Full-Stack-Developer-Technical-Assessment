import { env } from "@/env";
import { PrismaClient } from "../../generated/prisma";

// Instantiates a configured PrismaClient. In development, queries are logged to stdout.
const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Note for Reviewers: Next.js Fast Refresh (HMR) re-executes server modules on every file change.
// To prevent exhausting database connection pools, the client is cached on the Node.js global object.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
