import { Router } from "express";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { OrderRepository } from "./order.repository";
import { OrderModel } from "../../database/models/order.model";

const router = Router();

const orderRepository = new OrderRepository(OrderModel);
const orderService = new OrderService(orderRepository);
const orderController = new OrderController(orderService);

router.post("/", orderController.createOrder);
router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrderById);

export default router;
