import { IOrderPagination, IOrderRepository } from "./order.type";
import { OrderModel } from "../../database/models/order.model";
import { IOrder } from "./order.type";
import { Types } from "mongoose";
import { GetOrdersInput } from "./order.schema";

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

  async findAll(
    userId: Types.ObjectId,
    query: GetOrdersInput
  ): Promise<IOrderPagination> {
    const result = await this.orderModel
      .find({ userId: userId, stage: query.stage })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await this.orderModel.countDocuments({
      userId: userId,
      stage: query.stage,
    });

    const pagination: IOrderPagination = {
      orders: result,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      hasNextPage: query.page < Math.ceil(total / query.limit),
      hasPreviousPage: query.page > 1,
    };

    return pagination;
  }
}
