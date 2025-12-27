import { Types } from "mongoose";

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
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderRepository {
  create(order: IOrder): Promise<IOrder>;
  findById(id: Types.ObjectId): Promise<IOrder | null>;
  findByStage(stage: ENUMOrderStage): Promise<IOrder[]>;
  findByStatus(status: ENUMOrderStatus): Promise<IOrder[]>;
  findByExpiresAt(expiresAt: Date): Promise<IOrder[]>;
  update(id: Types.ObjectId, order: IOrder): Promise<IOrder | null>;
  delete(id: Types.ObjectId): Promise<boolean>;
}
