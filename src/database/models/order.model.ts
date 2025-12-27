import mongoose from "mongoose";
import {
  IOrder,
  ENUMOrderStage,
  ENUMOrderStatus,
} from "../../modules/orders/order.type";

const orderSchema = new mongoose.Schema<IOrder>(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    labName: { type: String, required: true, index: true },
    patientName: { type: String, required: true, index: true },
    clinicName: { type: String, required: true, index: true },
    stage: { type: String, enum: ENUMOrderStage, required: true, index: true },
    status: {
      type: String,
      enum: ENUMOrderStatus,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const OrderModel = mongoose.model<IOrder>("Order", orderSchema);
