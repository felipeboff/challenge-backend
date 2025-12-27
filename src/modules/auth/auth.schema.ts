import { z } from "zod";

export const RegisterSchema = z
  .object({
    email: z.email().min(1).max(100),
    password: z.string().min(8).max(100),
  })
  .strict();

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z
  .object({
    email: z.email().min(1).max(100),
    password: z.string().min(8).max(100),
  })
  .strict();

export type LoginInput = z.infer<typeof LoginSchema>;
