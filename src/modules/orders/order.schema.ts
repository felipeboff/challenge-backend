import z from "zod";
import { ENUMOrderStage, ENUMOrderStatus } from "./order.type";
import { Types } from "mongoose";

export const CreateOrderSchema = z.object({
  labName: z.string().min(3).max(100),
  patientName: z.string().min(3).max(100),
  clinicName: z.string().min(3).max(100),
  stage: z.enum(ENUMOrderStage),
  status: z.enum(ENUMOrderStatus),
  userId: z.custom<Types.ObjectId>(),
  expiresAt: z.date(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
