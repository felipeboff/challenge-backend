import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { CreateOrderSchema, GetOrdersSchema } from "./order.schema";
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

    const query = GetOrdersSchema.parse(req.query);

    const orders = await this.orderService.getOrders(user, query);
    return HttpResponse.ok(res, orders);
  };

  public getOrderById = async (req: Request, res: Response) => {
    const user = req.authContext!.user;

    const id = toObjectId(req.params.id);
    if (!id) {
      throw new BadRequestError("Invalid order ID");
    }

    const order = await this.orderService.getOrderById(id, user);
    return HttpResponse.ok(res, order);
  };
}
