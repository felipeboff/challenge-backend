import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../../shared/app-error";
import {
  CreateOrderInput,
  GetOrdersInput,
  UpdateOrderInput,
} from "./order.schema";
import {
  ALLOWED_ORDER_STAGE_TRANSITIONS,
  ENUMOrderStage,
  ENUMOrderStatus,
  IOrder,
  IOrderPagination,
  IOrderRepository,
  ORDER_STAGE_SEQUENCE,
} from "./order.type";
import { IUser } from "../users/user.type";
import { Types } from "mongoose";

export class OrderService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  public createOrder = async (
    order: CreateOrderInput,
    user: IUser
  ): Promise<IOrder> => {
    const orderData: IOrder = {
      ...order,
      _id: new Types.ObjectId(),
      userId: user._id,
      stage: ENUMOrderStage.ANALYSIS,
      status: ENUMOrderStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdOrder = await this.orderRepository.create(orderData);
    return createdOrder;
  };

  public getOrderById = async (
    id: Types.ObjectId,
    user: IUser
  ): Promise<IOrder> => {
    const order = await this.orderRepository.findById(id);
    if (!order || !order.userId.equals(user._id)) {
      throw new NotFoundError("Order not found");
    }

    return order;
  };

  public getOrders = async (
    user: IUser,
    query: GetOrdersInput
  ): Promise<IOrderPagination> => {
    const pagination = await this.orderRepository.findAll(user._id, query);
    return pagination;
  };

  public updateOrder = async (
    id: Types.ObjectId,
    user: IUser,
    data: UpdateOrderInput
  ): Promise<IOrder> => {
    const order = await this.orderRepository.findById(id);
    if (!order || !order.userId.equals(user._id)) {
      throw new NotFoundError("Order not found");
    }

    const orderData: IOrder = {
      ...order,
      ...data,
      updatedAt: new Date(),
    };

    if (orderData.stage !== order.stage) {
      const allowedTransition = ALLOWED_ORDER_STAGE_TRANSITIONS.find(
        (transition) => transition.from === order.stage
      )?.to.includes(orderData.stage);

      if (!allowedTransition) {
        throw new BadRequestError(
          `Cannot transition from ${order.stage} to ${orderData.stage}`
        );
      }
    }

    const updatedOrder = await this.orderRepository.update(id, orderData);
    if (!updatedOrder) {
      throw new InternalServerError("Failed to update order");
    }

    return updatedOrder;
  };

  public advanceOrderStage = async (
    id: Types.ObjectId,
    user: IUser
  ): Promise<IOrder> => {
    const order = await this.orderRepository.findById(id);
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

    const updatedOrder = await this.orderRepository.update(id, orderData);
    if (!updatedOrder) {
      throw new InternalServerError("Failed to update order");
    }

    return updatedOrder;
  };
}
