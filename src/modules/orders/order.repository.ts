import { IOrderPagination, IOrderRepository } from "./order.type";
import { OrderModel } from "../../database/models/order.model";
import { IOrder } from "./order.type";
import { Types } from "mongoose";
import { GetOrdersInput } from "./order.schema";

export class OrderRepository implements IOrderRepository {
  constructor(private readonly orderModel: typeof OrderModel) {}

  public create = async (order: IOrder): Promise<IOrder> => {
    const result = await this.orderModel.create(order);
    return result.toObject();
  };

  public findById = async (id: Types.ObjectId): Promise<IOrder | null> => {
    const result = await this.orderModel.findById(id).lean();
    return result;
  };

  public update = async (
    id: Types.ObjectId,
    data: IOrder
  ): Promise<IOrder | null> => {
    const result = await this.orderModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean();
    return result;
  };

  public findAll = async (
    userId: Types.ObjectId,
    query: GetOrdersInput
  ): Promise<IOrderPagination> => {
    const filter: { userId: Types.ObjectId; stage?: string } = { userId };
    if (query.stage) {
      filter.stage = query.stage;
    }

    const result = await this.orderModel
      .find(filter)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await this.orderModel.countDocuments(filter);

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
  };
}
