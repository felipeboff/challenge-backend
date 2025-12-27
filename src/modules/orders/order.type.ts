import { Types } from "mongoose";
import { GetOrdersInput } from "./order.schema";

export enum ENUMOrderStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ENUMOrderStage {
  ANALYSIS = "analysis",
  REVIEW = "review",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface IOrder {
  _id: Types.ObjectId;
  labName: string;
  patientName: string;
  clinicName: string;
  stage: ENUMOrderStage;
  status: ENUMOrderStatus;
  userId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderPagination {
  orders: IOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IOrderRepository {
  create(order: IOrder): Promise<IOrder>;
  findById(id: Types.ObjectId): Promise<IOrder | null>;
  findAll(
    userId: Types.ObjectId,
    query: GetOrdersInput
  ): Promise<IOrderPagination>;
}
