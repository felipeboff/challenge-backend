import { z } from "zod";

export const RegisterUserSchema = z
  .object({
    email: z.email().min(1).max(100),
    password: z.string().min(8).max(100),
  })
  .strict();

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z
  .object({
    email: z.email().min(1).max(100),
    password: z.string().min(8).max(100),
  })
  .strict();

export type LoginUserInput = z.infer<typeof LoginUserSchema>;
