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
