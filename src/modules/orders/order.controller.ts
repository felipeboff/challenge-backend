import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { CreateOrderSchema } from "./order.schema";
import { BadRequestError } from "../../shared/app-error";
import { toObjectId } from "../../shared/object-id-utils";
import { HttpResponse } from "../../shared/http-response";

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  public async createOrder(req: Request, res: Response) {
    const user = req.authContext!.user;

    const data = CreateOrderSchema.parse(req.body);

    const order = await this.orderService.createOrder(data, user);
    return HttpResponse.created(res, order);
  }

  public async getOrders(req: Request, res: Response) {
    const user = req.authContext!.user;
    const orders = await this.orderService.getOrders(user);
    return HttpResponse.ok(res, orders);
  }

  public async getOrderById(req: Request, res: Response) {
    const user = req.authContext!.user;

    const id = toObjectId(req.params.id);
    if (!id) {
      throw new BadRequestError("Invalid order ID");
    }

    const order = await this.orderService.getOrderById(id, user);
    return HttpResponse.ok(res, order);
  }
}
