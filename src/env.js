import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  // Server-side schemas for strict env validation on startup

  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  // Client-side schemas prefixed with NEXT_PUBLIC_ (empty by default)
  client: {},

  // Manual env destructuring required for compatibility with client-side & edge runtimes
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
  // Bypasses validation checks during builds or Docker configurations
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  // Coerces empty strings to undefined so that default fallbacks are triggered
  emptyStringAsUndefined: true,
});
