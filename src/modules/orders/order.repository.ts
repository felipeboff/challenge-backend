import { IOrderRepository } from "./order.type";
import { OrderModel } from "../../database/models/order.model";
import { IOrder } from "./order.type";
import { Types } from "mongoose";

export class OrderRepository implements IOrderRepository {
  constructor(private readonly orderModel: typeof OrderModel) {}

  async create(order: IOrder): Promise<IOrder> {
    const result = await this.orderModel.create(order);
    return result.toObject();
  }

  async findById(id: Types.ObjectId): Promise<IOrder | null> {
    const result = await this.orderModel.findById(id).lean();
    return result;
  }

  async findAll(userId: Types.ObjectId): Promise<IOrder[]> {
    const result = await this.orderModel.find({ userId: userId }).lean();
    return result;
  }
}
