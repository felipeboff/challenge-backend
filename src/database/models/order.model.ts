import mongoose, { Types } from "mongoose";

import {
  ENUMOrderServiceStatus,
  ENUMOrderStage,
  ENUMOrderStatus,
  IOrder,
  IOrderService,
} from "../../modules/orders/order.type";

const serviceSchema = new mongoose.Schema<IOrderService>(
  {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ENUMOrderServiceStatus,
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    id: true,
  }
);

const orderSchema = new mongoose.Schema<IOrder>(
  {
    labName: {
      type: String,
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    clinicName: {
      type: String,
      required: true,
    },
    stage: {
      type: String,
      enum: ENUMOrderStage,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ENUMOrderStatus,
      required: true,
      index: true,
    },
    services: {
      type: [serviceSchema],
      required: true,
      validate: {
        validator: (v: IOrderService[]) => v.length > 0,
        message: "Services must be at least 1",
      },
    },
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    id: true,
  }
);

export const OrderModel = mongoose.model<IOrder>("Order", orderSchema);
