import { Request, Response } from "express";

import { BadRequestError } from "../../shared/app-error";
import { HttpResponse } from "../../shared/http-response";
import { transformObjectId } from "../../shared/transform-object-id";
import {
  CreateOrderSchema,
  CreateServiceSchema,
  GetOrdersQuerySchema,
  UpdateOrderSchema,
  UpdateServiceSchema,
} from "./order.schema";
import type { OrderService } from "./order.service";
import type { IOrder, IOrderPagination, IOrderService } from "./order.type";

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  public createOrder = async (
    request: Request,
    response: Response
  ): Promise<Response<IOrder>> => {
    const user = request.authContext!.user;

    const body = CreateOrderSchema.parse(request.body);

    const order = await this.orderService.createOrder(body, user);
    return HttpResponse.created(response, order);
  };

  public getOrdersPaginated = async (
    request: Request,
    response: Response
  ): Promise<Response<IOrderPagination>> => {
    const user = request.authContext!.user;

    const query = GetOrdersQuerySchema.parse(request.query);

    const order = await this.orderService.getOrders(user, query);
    return HttpResponse.ok(response, order);
  };

  public getOrderById = async (
    request: Request,
    response: Response
  ): Promise<Response<IOrder>> => {
    const user = request.authContext!.user;

    const orderId = transformObjectId(request.params.orderId);
    if (!orderId) {
      throw new BadRequestError("Invalid order ID", {
        origin: this.getOrderById.name,
      });
    }

    const order = await this.orderService.getOrderById(orderId, user);
    return HttpResponse.ok(response, order);
  };

  public updateOrder = async (
    request: Request,
    response: Response
  ): Promise<Response<IOrder>> => {
    const user = request.authContext!.user;

    const orderId = transformObjectId(request.params.orderId);
    if (!orderId) {
      throw new BadRequestError("Invalid order ID", {
        origin: this.updateOrder.name,
      });
    }

    const data = UpdateOrderSchema.parse(request.body);
    const order = await this.orderService.updateOrder(orderId, user, data);
    return HttpResponse.ok(response, order);
  };

  public advanceOrderStage = async (
    request: Request,
    response: Response
  ): Promise<Response<IOrder>> => {
    const user = request.authContext!.user;

    const orderId = transformObjectId(request.params.orderId);
    if (!orderId) {
      throw new BadRequestError("Invalid order ID", {
        origin: this.advanceOrderStage.name,
      });
    }

    const order = await this.orderService.advanceOrderStage(orderId, user);
    return HttpResponse.ok(response, order);
  };

  public createService = async (
    request: Request,
    response: Response
  ): Promise<Response<IOrderService>> => {
    const user = request.authContext!.user;

    const orderId = transformObjectId(request.params.orderId);
    if (!orderId) {
      throw new BadRequestError("Invalid order ID", {
        origin: this.createService.name,
      });
    }

    const data = CreateServiceSchema.parse(request.body);
    const service = await this.orderService.createService(orderId, user, data);

    return HttpResponse.created(response, service);
  };

  public updateService = async (
    request: Request,
    response: Response
  ): Promise<Response<IOrderService>> => {
    const user = request.authContext!.user;

    const orderId = transformObjectId(request.params.orderId);
    if (!orderId) {
      throw new BadRequestError("Invalid order ID", {
        origin: "OrderController.updateService",
      });
    }

    const serviceId = transformObjectId(request.params.serviceId);
    if (!serviceId) {
      throw new BadRequestError("Invalid service ID", {
        origin: "OrderController.updateService",
      });
    }

    const data = UpdateServiceSchema.parse(request.body);
    const service = await this.orderService.updateService(
      orderId,
      serviceId,
      user,
      data
    );

    return HttpResponse.ok(response, service);
  };
}
