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
    user: IUser
  ): Promise<IOrder> => {
    if (order.services.length === 0) {
      throw new BadRequestError("Services are required", {
        origin: "OrderService.createOrder",
      });
    }

    const services = order.services.map((service) => ({
      ...service,
      id: new Types.ObjectId(),
      status: ENUMOrderServiceStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const totalValue = services.reduce(
      (acc: number, service: IOrderService) => acc + service.value,
      0
    );
    if (totalValue <= 0) {
      throw new BadRequestError(
        "Total value of services must be greater than 0",
        {
          origin: "OrderService.createOrder",
          totalValue,
        }
      );
    }

    const orderData: IOrder = {
      ...order,
      services,
      id: new Types.ObjectId(),
      userId: user.id,
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
    user: IUser
  ): Promise<IOrder> => {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found", {
        origin: "OrderService.getOrderById",
        orderId: orderId,
      });
    }

    if (!order.userId.equals(user.id)) {
      throw new NotFoundError("Order not found", {
        origin: "OrderService.getOrderById",
        orderId: orderId,
        message: "User does not have access to this order",
        userId: user.id,
        orderUserId: order.userId,
      });
    }

    return order;
  };

  public getOrders = async (
    user: IUser,
    query: GetOrdersQueryInput
  ): Promise<IOrderPagination> => {
    const pagination = await this.orderRepository.findAllPaginated(
      user.id,
      query
    );
    return pagination;
  };

  public updateOrder = async (
    orderId: Types.ObjectId,
    user: IUser,
    data: UpdateOrderInput
  ): Promise<IOrder> => {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found", {
        origin: "OrderService.updateOrder",
        orderId: orderId,
      });
    }

    if (!order.userId.equals(user.id)) {
      throw new NotFoundError("Order not found", {
        origin: "OrderService.updateOrder",
        orderId: orderId,
        message: "User does not have access to this order",
        userId: user.id,
        orderUserId: order.userId,
      });
    }

    const services: IOrderService[] | undefined = data.services?.map(
      (service: Partial<IOrderService>) => {
        const serviceFound = order.services.find((s) =>
          s.id.equals(service.id)
        );
        if (!serviceFound) {
          throw new NotFoundError("Service not found", {
            origin: "OrderService.updateOrder",
            orderId: orderId,
            serviceId: service.id,
          });
        }
        return {
          ...serviceFound,
          ...service,
        };
      }
    );

    if (!services) {
      throw new BadRequestError("Services not found", {
        origin: "OrderService.updateOrder",
        orderId,
      });
    }

    const totalValue = services.reduce(
      (acc: number, service: IOrderService) => acc + service.value,
      0
    );
    if (totalValue <= 0) {
      throw new BadRequestError(
        "Total value of services must be greater than 0",
        {
          origin: "OrderService.updateOrder",
          orderId,
          totalValue,
        }
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
        (transition) => transition.from === order.stage
      )?.to.includes(orderData.stage);

      if (!allowedTransition) {
        throw new BadRequestError(
          `Cannot transition from ${order.stage} to ${orderData.stage}`,
          {
            origin: "OrderService.updateOrder",
            orderId,
            currentStage: order.stage,
            newStage: orderData.stage,
          }
        );
      }
    }

    const updatedOrder = await this.orderRepository.update(orderId, orderData);
    if (!updatedOrder) {
      throw new InternalServerError("Failed to update order", {
        origin: "OrderService.updateOrder",
        orderId,
      });
    }

    return updatedOrder;
  };

  public advanceOrderStage = async (
    orderId: Types.ObjectId,
    user: IUser
  ): Promise<IOrder> => {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found", {
        origin: "OrderService.advanceOrderStage",
        orderId: orderId,
      });
    }

    if (!order.userId.equals(user.id)) {
      throw new NotFoundError("Order not found", {
        origin: "OrderService.advanceOrderStage",
        orderId: orderId,
        message: "User does not have access to this order",
        userId: user.id,
        orderUserId: order.userId,
      });
    }

    const stageIndex = Object.values(ORDER_STAGE_SEQUENCE).indexOf(order.stage);
    const nextStage: ENUMOrderStage | undefined =
      ORDER_STAGE_SEQUENCE[stageIndex + 1];
    if (!nextStage) {
      throw new BadRequestError(`Cannot advance from stage ${order.stage}`, {
        origin: "OrderService.advanceOrderStage",
        orderId,
        currentStage: order.stage,
        nextStage,
      });
    }

    const orderData: IOrder = {
      ...order,
      stage: nextStage,
      updatedAt: new Date(),
    };

    const updatedOrder = await this.orderRepository.update(orderId, orderData);
    if (!updatedOrder) {
      throw new InternalServerError("Failed to update order", {
        origin: "OrderService.advanceOrderStage",
        orderId,
      });
    }

    return updatedOrder;
  };

  public createService = async (
    orderId: Types.ObjectId,
    user: IUser,
    data: CreateServiceInput
  ): Promise<IOrderService> => {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found", {
        origin: "OrderService.createService",
        orderId: orderId,
      });
    }

    if (!order.userId.equals(user.id)) {
      throw new NotFoundError("Order not found", {
        origin: "OrderService.createService",
        orderId: orderId,
        message: "User does not have access to this order",
        userId: user.id,
        orderUserId: order.userId,
      });
    }

    const service: IOrderService = {
      ...data,
      id: new Types.ObjectId(),
      status: ENUMOrderServiceStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdService = await this.orderRepository.createService(
      orderId,
      service
    );
    return createdService;
  };

  public updateService = async (
    orderId: Types.ObjectId,
    serviceId: Types.ObjectId,
    user: IUser,
    data: UpdateServiceInput
  ): Promise<IOrderService> => {
    const order = await this.orderRepository.findById(orderId);

    if (!order.userId.equals(user.id)) {
      throw new NotFoundError("Order not found", {
        origin: "OrderService.updateService",
        orderId: orderId,
        message: "User does not have access to this order",
        userId: user.id,
        orderUserId: order.userId,
      });
    }

    const serviceFound = order.services.find((s) => s.id.equals(serviceId));
    if (!serviceFound) {
      throw new NotFoundError("Service not found", {
        origin: "OrderService.updateService",
        orderId: orderId,
        serviceId: serviceId,
      });
    }

    const serviceUpdate: IOrderService = {
      ...serviceFound,
      ...data,
    };

    const updatedService = await this.orderRepository.updateService(
      orderId,
      serviceId,
      serviceUpdate
    );
    return updatedService;
  };
}
