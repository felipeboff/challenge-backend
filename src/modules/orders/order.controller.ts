import { Request, Response } from "express";
import { OrderService } from "./order.service";
import {
  CreateOrderSchema,
  CreateServiceSchema,
  GetOrdersQuerySchema,
  UpdateOrderSchema,
  UpdateServiceSchema,
} from "./order.schema";
import { BadRequestError } from "../../shared/app-error";
import { toObjectId } from "../../shared/object-id-utils";
import { HttpResponse } from "../../shared/http-response";

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  public createOrder = async (req: Request, res: Response) => {
    const user = req.authContext!.user;

    const data = CreateOrderSchema.parse(req.body);

    const order = await this.orderService.createOrder(data, user);
    return HttpResponse.created(res, order);
  };

  public getOrders = async (req: Request, res: Response) => {
    const user = req.authContext!.user;

    const query = GetOrdersQuerySchema.parse(req.query);

    const orders = await this.orderService.getOrders(user, query);
    return HttpResponse.ok(res, orders);
  };

  public getOrderById = async (req: Request, res: Response) => {
    const user = req.authContext!.user;

    const orderId = toObjectId(req.params.orderId);
    if (!orderId) {
      throw new BadRequestError("Invalid order ID");
    }

    const order = await this.orderService.getOrderById(orderId, user);
    return HttpResponse.ok(res, order);
  };

  public updateOrder = async (req: Request, res: Response) => {
    const user = req.authContext!.user;

    const orderId = toObjectId(req.params.orderId);
    if (!orderId) {
      throw new BadRequestError("Invalid order ID");
    }

    const data = UpdateOrderSchema.parse(req.body);
    const order = await this.orderService.updateOrder(orderId, user, data);
    return HttpResponse.ok(res, order);
  };

  public advanceOrderStage = async (req: Request, res: Response) => {
    const user = req.authContext!.user;

    const orderId = toObjectId(req.params.orderId);
    if (!orderId) {
      throw new BadRequestError("Invalid order ID");
    }

    const order = await this.orderService.advanceOrderStage(orderId, user);
    return HttpResponse.ok(res, order);
  };

  public createService = async (req: Request, res: Response) => {
    const user = req.authContext!.user;

    const orderId = toObjectId(req.params.orderId);
    if (!orderId) {
      throw new BadRequestError("Invalid order ID");
    }

    const data = CreateServiceSchema.parse(req.body);
    const service = await this.orderService.createService(orderId, user, data);

    return HttpResponse.created(res, service);
  };

  public updateService = async (req: Request, res: Response) => {
    const user = req.authContext!.user;

    const orderId = toObjectId(req.params.orderId);
    if (!orderId) {
      throw new BadRequestError("Invalid order ID");
    }

    const serviceId = toObjectId(req.params.serviceId);
    if (!serviceId) {
      throw new BadRequestError("Invalid service ID");
    }

    const data = UpdateServiceSchema.parse(req.body);
    const service = await this.orderService.updateService(
      orderId,
      serviceId,
      user,
      data
    );

    return HttpResponse.ok(res, service);
  };
}
