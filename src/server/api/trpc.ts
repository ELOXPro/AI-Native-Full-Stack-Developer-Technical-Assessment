// Core tRPC backend configuration, initializing contexts, routers, and base procedures.
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@/server/db";

// Part 1: Context definition. Passes database reference and HTTP headers to procedures.
export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    db,
    ...opts,
  };
};

// Part 2: Router and procedure initialization, configuring SuperJSON serialization and custom Zod error formatting.
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Server-side caller factory utility.
export const createCallerFactory = t.createCallerFactory;

// Part 3: Procedures and Middleware.

// Router factory builder.
export const createTRPCRouter = t.router;

// Timing middleware which tracks procedure runtime duration.
// Note for Reviewers: Adds an artificial delay (100ms - 500ms) in development.
// This simulates real-world latency to surface UI request waterfall patterns during local dev.
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // Induces latency in development environments
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

// Base unauthenticated procedure bound to timing diagnostics middleware
export const publicProcedure = t.procedure.use(timingMiddleware);
