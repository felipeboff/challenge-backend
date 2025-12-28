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
  update(id: Types.ObjectId, data: IOrder): Promise<IOrder | null>;
  findById(id: Types.ObjectId): Promise<IOrder | null>;
  findAll(
    userId: Types.ObjectId,
    query: GetOrdersInput
  ): Promise<IOrderPagination>;
}

export const ALLOWED_ORDER_STAGE_TRANSITIONS: {
  from: ENUMOrderStage;
  to: ENUMOrderStage[];
}[] = [
  {
    from: ENUMOrderStage.ANALYSIS,
    to: [ENUMOrderStage.REVIEW],
  },
  {
    from: ENUMOrderStage.REVIEW,
    to: [ENUMOrderStage.APPROVED],
  },
];

export const ORDER_STAGE_SEQUENCE: Record<number, ENUMOrderStage> = {
  0: ENUMOrderStage.ANALYSIS,
  1: ENUMOrderStage.REVIEW,
  2: ENUMOrderStage.APPROVED,
};
