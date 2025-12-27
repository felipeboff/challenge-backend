import { config } from "dotenv";
import z from "zod";

config({
  path: ".env",
});

const envSchema = z.object({
  PORT: z.coerce.number().min(1),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN_MINUTES: z.coerce.number().min(1),
  JWT_ALGORITHM: z.enum(["HS256", "RS256", "ES256", "PS256"]),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(result.error.message);
  process.exit(1);
}

export const env = result.data;
