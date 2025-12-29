import { type Model, Types } from "mongoose";

import { NotFoundError } from "../../shared/app-error";
import type { GetOrdersQueryInput } from "./order.schema";
import type { IOrderPagination, IOrderService } from "./order.type";
import type { IOrder } from "./order.type";

export class OrderRepository {
  constructor(private readonly orderModel: Model<IOrder>) {}

  public create = async (order: IOrder): Promise<IOrder> => {
    const result = await this.orderModel.create(order);
    return result.toObject();
  };

  public findById = async (orderId: Types.ObjectId): Promise<IOrder | null> => {
    const result = await this.orderModel.findById(orderId).lean();
    return result;
  };

  public createService = async (
    orderId: Types.ObjectId,
    service: IOrderService,
  ): Promise<IOrderService> => {
    const result = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        { $push: { services: service } },
        { new: true },
      )
      .lean();

    const createdService = result?.services.find((s) =>
      s._id.equals(service._id),
    );
    if (!createdService) {
      throw new NotFoundError("Service not found");
    }

    return createdService;
  };

  public update = async (
    orderId: Types.ObjectId,
    data: IOrder,
  ): Promise<IOrder | null> => {
    const result = await this.orderModel
      .findByIdAndUpdate(orderId, data, { new: true })
      .lean();
    return result;
  };

  public findAllPaginated = async (
    userId: Types.ObjectId,
    query: GetOrdersQueryInput,
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

  public updateService = async (
    orderId: Types.ObjectId,
    serviceId: Types.ObjectId,
    service: IOrderService,
  ): Promise<IOrderService> => {
    const result = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        { $set: { "services.$[elem]": service } },
        {
          new: true,
          arrayFilters: [{ "elem._id": serviceId }],
        },
      )
      .lean();

    const updatedService = result?.services.find((s) =>
      s._id.equals(serviceId),
    );
    if (!updatedService) {
      throw new NotFoundError("Service not found");
    }

    return updatedService;
  };
}
