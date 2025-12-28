import z from "zod";
import { ENUMOrderStage, ENUMOrderStatus } from "./order.type";
import { Types } from "mongoose";
import { ObjectIdSchema } from "../../shared/object-id-schema";

export const CreateOrderSchema = z
  .object({
    labName: z
      .string()
      .min(3, { message: "Lab Name must be at least 3 characters" })
      .max(100, { message: "Lab Name must be at most 100 characters" }),
    patientName: z
      .string()
      .min(3, { message: "Patient Name must be at least 3 characters" })
      .max(100, { message: "Patient Name must be at most 100 characters" }),
    clinicName: z
      .string()
      .min(3, { message: "Clinic Name must be at least 3 characters" })
      .max(100, { message: "Clinic Name must be at most 100 characters" }),
    expiresAt: z.coerce.date({ message: "Invalid Expires At" }),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderSchema = z
  .object({
    _id: z
      .custom<Types.ObjectId>(ObjectIdSchema, { message: "Invalid Order ID" })
      .optional(),
    userId: z
      .custom<Types.ObjectId>(ObjectIdSchema, { message: "Invalid User ID" })
      .optional(),
    stage: z
      .enum(ENUMOrderStage, { message: "Invalid Order Stage" })
      .optional(),
    status: z
      .enum(ENUMOrderStatus, { message: "Invalid Order Status" })
      .optional(),
    expiresAt: z.coerce.date({ message: "Invalid Expires At" }).optional(),
    labName: z
      .string()
      .min(3, { message: "Lab Name must be at least 3 characters" })
      .max(100, { message: "Lab Name must be at most 100 characters" })
      .optional(),
    patientName: z
      .string()
      .min(3, { message: "Patient Name must be at least 3 characters" })
      .max(100, {
        message: "Patient Name must be at most 100 characters",
      })
      .optional(),
    clinicName: z
      .string()
      .min(3, { message: "Clinic Name must be at least 3 characters" })
      .max(100, { message: "Clinic Name must be at most 100 characters" })
      .optional(),
    updatedAt: z.coerce.date({ message: "Invalid Updated At" }).optional(),
    createdAt: z.coerce.date({ message: "Invalid Created At" }).optional(),
  })
  .strict();

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;

export const GetOrdersSchema = z.object({
  page: z.coerce
    .number()
    .min(1, { message: "Page must be at least 1" })
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .min(1, { message: "Limit must be at least 1" })
    .optional()
    .default(50),
  stage: z.enum(ENUMOrderStage, { message: "Invalid Order Stage" }).optional(),
});

export type GetOrdersInput = z.infer<typeof GetOrdersSchema>;
