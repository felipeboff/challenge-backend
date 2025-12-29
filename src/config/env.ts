import { config } from "dotenv";
import z from "zod";

import { logger } from "../shared/logger";

config({
  path: ".env",
  quiet: true,
});

const envSchema = z.object({
  PORT: z.coerce.number().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]),
  MONGO_URI: z.string().min(1),
  MONGO_DB_TEST: z.string().min(1),
  MONGO_DB_PRODUCTION: z.string().min(1),
  MONGO_DB_DEVELOPMENT: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN_MINUTES: z.coerce.number().min(1),
  JWT_ALGORITHM: z.enum(["HS256", "RS256", "ES256", "PS256"]),
  PASSWORD_SALT: z.coerce.number().min(8).max(10),
  PASSWORD_SECRET: z.string().length(8),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  logger.error("Environment validation error:", {
    error: result.error,
  });
  process.exit(1);
}

export const env = result.data;
