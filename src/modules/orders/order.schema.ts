import z from "zod";
import {
  ENUMOrderStage,
  ENUMOrderStatus,
  ENUMServiceStatus,
} from "./order.type";
import { Types } from "mongoose";
import { ObjectIdSchema } from "../../shared/object-id-schema";

export const CreateServiceSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: "Service Name must be at least 3 characters" })
      .max(100, { message: "Service Name must be at most 100 characters" }),
    value: z.number().min(0, { message: "Service Value must be at least 0" }),
  })
  .strict();

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

export const UpdateServiceSchema = z
  .object({
    _id: z
      .custom<Types.ObjectId>(ObjectIdSchema, { message: "Invalid Service ID" })
      .optional(),
    name: z
      .string()
      .min(3, { message: "Service Name must be at least 3 characters" })
      .max(100, { message: "Service Name must be at most 100 characters" })
      .optional(),
    value: z
      .number()
      .min(0, { message: "Service Value must be at least 0" })
      .optional(),
    createdAt: z.coerce.date({ message: "Invalid Created At" }).optional(),
    updatedAt: z.coerce.date({ message: "Invalid Updated At" }).optional(),
    status: z
      .enum(ENUMServiceStatus, { message: "Invalid Service Status" })
      .optional(),
  })
  .strict();

export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;

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
    services: z
      .array(CreateServiceSchema)
      .min(1, { message: "Services must be at least 1" }),
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
    services: z
      .array(UpdateServiceSchema)
      .min(1, { message: "Services must be at least 1" })
      .optional(),
  })
  .strict();

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;

export const GetOrdersQuerySchema = z.object({
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

export type GetOrdersQueryInput = z.infer<typeof GetOrdersQuerySchema>;
