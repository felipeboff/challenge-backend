import { Types } from "mongoose";
import { GetOrdersInput } from "./order.schema";

export enum ENUMOrderStatus {
  ACTIVE = "active",
  DELETED = "deleted",
}

export enum ENUMOrderStage {
  CREATED = "created",
  ANALYSIS = "analysis",
  COMPLETED = "completed",
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
    from: ENUMOrderStage.CREATED,
    to: [ENUMOrderStage.ANALYSIS],
  },
  {
    from: ENUMOrderStage.ANALYSIS,
    to: [ENUMOrderStage.COMPLETED],
  },
];

export const ORDER_STAGE_SEQUENCE: Record<number, ENUMOrderStage> = {
  0: ENUMOrderStage.CREATED,
  1: ENUMOrderStage.ANALYSIS,
  2: ENUMOrderStage.COMPLETED,
};
