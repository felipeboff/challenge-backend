import { config } from "dotenv";
import z from "zod";

config({
  path: ".env",
});

const envSchema = z.object({
  PORT: z.coerce.number().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]),
  MONGO_URI: z.string().min(1),
  MONGO_DB_TEST: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN_MINUTES: z.coerce.number().min(1),
  JWT_ALGORITHM: z.enum(["HS256", "RS256", "ES256", "PS256"]),
  PASSWORD_SALT: z.coerce.number().min(8).max(10),
  PASSWORD_SECRET: z.string().length(8),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(result.error.message);
  process.exit(1);
}

export const env = result.data;
