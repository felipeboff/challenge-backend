import { BadRequestError, NotFoundError } from "../../shared/app-error";
import { CreateOrderInput, CreateOrderSchema } from "./order.schema";
import { IOrder, IOrderRepository } from "./order.type";
import { IUser } from "../users/user.type";
import { Types } from "mongoose";

export class OrderService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  public async createOrder(
    order: CreateOrderInput,
    user: IUser
  ): Promise<IOrder> {
    if (!user._id.equals(order.userId)) {
      throw new BadRequestError("User cannot create order for another user");
    }

    const orderData: IOrder = {
      ...order,
      _id: new Types.ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdOrder = await this.orderRepository.create(orderData);
    return createdOrder;
  }

  public async getOrderById(id: Types.ObjectId, user: IUser): Promise<IOrder> {
    const order = await this.orderRepository.findById(id);
    if (!order || !order.userId.equals(user._id)) {
      throw new NotFoundError("Order not found");
    }

    return order;
  }

  public async getOrders(user: IUser): Promise<IOrder[]> {
    const orders = await this.orderRepository.findAll(user._id);
    return orders;
  }
}
