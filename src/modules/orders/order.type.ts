import { Types } from "mongoose";

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
  services: IOrderService[];
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

export enum ENUMOrderServiceStatus {
  PENDING = "pending",
  DONE = "done",
  CANCELLED = "cancelled",
}
export interface IOrderService {
  _id: Types.ObjectId;
  name: string;
  value: number;
  status: ENUMOrderServiceStatus;
  createdAt: Date;
  updatedAt: Date;
}
