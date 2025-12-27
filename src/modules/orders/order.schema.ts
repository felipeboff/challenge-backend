import z from "zod";
import { ENUMOrderStage, ENUMOrderStatus } from "./order.type";
import { Types } from "mongoose";

export const CreateOrderSchema = z.object({
  labName: z.string().min(3).max(100),
  patientName: z.string().min(3).max(100),
  clinicName: z.string().min(3).max(100),
  stage: z.enum(ENUMOrderStage),
  status: z.enum(ENUMOrderStatus),
  userId: z
    .custom<Types.ObjectId>(
      (val) => typeof val === "string" && Types.ObjectId.isValid(val),
      {
        message: "Invalid user ID",
      }
    )
    .optional(),
  expiresAt: z.coerce.date(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const GetOrdersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).optional().default(50),
  stage: z.enum(ENUMOrderStage).optional(),
});

export type GetOrdersInput = z.infer<typeof GetOrdersSchema>;
