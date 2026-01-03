import { Router } from "express";

import { OrderModel } from "../../database/models/order.model";
import { OrderController } from "./order.controller";
import { OrderRepository } from "./order.repository";
import { OrderService } from "./order.service";

const router = Router();

const orderRepository = new OrderRepository(OrderModel);
const orderService = new OrderService(orderRepository);
const orderController = new OrderController(orderService);

router.post("/", orderController.createOrder);
router.get("/", orderController.getOrdersPaginated);
router.get("/:orderId", orderController.getOrderById);
router.put("/:orderId", orderController.updateOrder);
router.post("/:orderId/advance", orderController.advanceOrderStage);
router.post("/:orderId/services", orderController.createService);
router.put("/:orderId/services/:serviceId", orderController.updateService);

export default router;
