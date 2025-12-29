import { Types } from "mongoose";

import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../../shared/app-error";
import type { IUser } from "../users/user.type";
import type { OrderRepository } from "./order.repository";
import type {
  CreateOrderInput,
  CreateServiceInput,
  GetOrdersQueryInput,
  UpdateOrderInput,
  UpdateServiceInput,
} from "./order.schema";
import type { IOrder, IOrderPagination, IOrderService } from "./order.type";
import {
  ALLOWED_ORDER_STAGE_TRANSITIONS,
  ENUMOrderServiceStatus,
  ENUMOrderStage,
  ENUMOrderStatus,
  ORDER_STAGE_SEQUENCE,
} from "./order.type";

export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  public createOrder = async (
    order: CreateOrderInput,
    user: IUser,
  ): Promise<IOrder> => {
    const services = order.services.map((service) => ({
      ...service,
      _id: new Types.ObjectId(),
      status: ENUMOrderServiceStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const totalValue = services.reduce(
      (acc: number, service: IOrderService) => acc + service.value,
      0,
    );
    if (totalValue <= 0) {
      throw new BadRequestError(
        "Total value of services must be greater than 0",
      );
    }

    const orderData: IOrder = {
      ...order,
      services,
      _id: new Types.ObjectId(),
      userId: user._id,
      stage: ENUMOrderStage.CREATED,
      status: ENUMOrderStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdOrder = await this.orderRepository.create(orderData);
    return createdOrder;
  };

  public getOrderById = async (
    orderId: Types.ObjectId,
    user: IUser,
  ): Promise<IOrder> => {
    const order = await this.orderRepository.findById(orderId);
    if (!order || !order.userId.equals(user._id)) {
      throw new NotFoundError("Order not found");
    }

    return order;
  };

  public getOrders = async (
    user: IUser,
    query: GetOrdersQueryInput,
  ): Promise<IOrderPagination> => {
    const pagination = await this.orderRepository.findAllPaginated(
      user._id,
      query,
    );
    return pagination;
  };

  public updateOrder = async (
    orderId: Types.ObjectId,
    user: IUser,
    data: UpdateOrderInput,
  ): Promise<IOrder> => {
    const order = await this.orderRepository.findById(orderId);
    if (!order || !order.userId.equals(user._id)) {
      throw new NotFoundError("Order not found");
    }

    const services: IOrderService[] | undefined = data.services?.map(
      (service: Partial<IOrderService>) => {
        const serviceFound = order.services.find((s) =>
          s._id.equals(service._id),
        );
        if (!serviceFound) {
          throw new NotFoundError("Service not found");
        }
        return {
          ...serviceFound,
          ...service,
        };
      },
    );

    if (!services) {
      throw new BadRequestError("Services not found");
    }

    const totalValue = services.reduce(
      (acc: number, service: IOrderService) => acc + service.value,
      0,
    );
    if (totalValue <= 0) {
      throw new BadRequestError(
        "Total value of services must be greater than 0",
      );
    }

    const orderData: IOrder = {
      ...order,
      ...data,
      services,
      updatedAt: new Date(),
    };

    if (orderData.stage !== order.stage) {
      const allowedTransition = ALLOWED_ORDER_STAGE_TRANSITIONS.find(
        (transition) => transition.from === order.stage,
      )?.to.includes(orderData.stage);

      if (!allowedTransition) {
        throw new BadRequestError(
          `Cannot transition from ${order.stage} to ${orderData.stage}`,
        );
      }
    }

    const updatedOrder = await this.orderRepository.update(orderId, orderData);
    if (!updatedOrder) {
      throw new InternalServerError("Failed to update order");
    }

    return updatedOrder;
  };

  public advanceOrderStage = async (
    orderId: Types.ObjectId,
    user: IUser,
  ): Promise<IOrder> => {
    const order = await this.orderRepository.findById(orderId);
    if (!order || !order.userId.equals(user._id)) {
      throw new NotFoundError("Order not found");
    }

    const stageIndex = Object.keys(ORDER_STAGE_SEQUENCE).indexOf(order.stage);
    const nextStage: ENUMOrderStage | undefined =
      ORDER_STAGE_SEQUENCE[stageIndex + 1];
    if (!nextStage) {
      throw new BadRequestError(`Cannot advance from stage ${order.stage}`);
    }

    const orderData: IOrder = {
      ...order,
      stage: nextStage,
      updatedAt: new Date(),
    };

    const updatedOrder = await this.orderRepository.update(orderId, orderData);
    if (!updatedOrder) {
      throw new InternalServerError("Failed to update order");
    }

    return updatedOrder;
  };

  public createService = async (
    orderId: Types.ObjectId,
    user: IUser,
    data: CreateServiceInput,
  ): Promise<IOrderService> => {
    const order = await this.orderRepository.findById(orderId);
    if (!order || !order.userId.equals(user._id)) {
      throw new NotFoundError("Order not found");
    }

    const service: IOrderService = {
      ...data,
      _id: new Types.ObjectId(),
      status: ENUMOrderServiceStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdService = await this.orderRepository.createService(
      orderId,
      service,
    );
    return createdService;
  };

  public updateService = async (
    orderId: Types.ObjectId,
    serviceId: Types.ObjectId,
    user: IUser,
    data: UpdateServiceInput,
  ): Promise<IOrderService> => {
    const order = await this.orderRepository.findById(orderId);
    if (!order || !order.userId.equals(user._id)) {
      throw new NotFoundError("Order not found");
    }

    const serviceFound = order.services.find((s) => s._id.equals(serviceId));
    if (!serviceFound) {
      throw new NotFoundError("Service not found");
    }

    const service: IOrderService = {
      ...serviceFound,
      ...data,
      updatedAt: new Date(),
    };

    const updatedService = await this.orderRepository.updateService(
      orderId,
      serviceId,
      service,
    );
    return updatedService;
  };
}
