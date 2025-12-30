import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { ZodError } from "zod";

import { BadRequestError, NotFoundError } from "../../../shared/app-error";
import { OrderController } from "../../../modules/orders/order.controller";
import type { OrderService } from "../../../modules/orders/order.service";
import type {
  IOrder,
  IOrderPagination,
  IOrderService,
} from "../../../modules/orders/order.type";
import {
  ENUMOrderServiceStatus,
  ENUMOrderStage,
  ENUMOrderStatus,
} from "../../../modules/orders/order.type";
import type { IUser } from "../../../modules/users/user.type";
import {
  createMockOrderInput,
  createMockServiceInput,
} from "../../mocks/order.mock";

describe("OrderController - Unit Tests", () => {
  let orderController: OrderController;
  let mockOrderService: OrderService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockUser: IUser;

  beforeEach(() => {
    // Create mocks
    mockOrderService = {
      createOrder: vi.fn(),
      getOrders: vi.fn(),
      getOrderById: vi.fn(),
      updateOrder: vi.fn(),
      advanceOrderStage: vi.fn(),
      createService: vi.fn(),
      updateService: vi.fn(),
    } as unknown as OrderService;

    mockUser = {
      id: new Types.ObjectId(),
      email: "test@example.com",
      password: "hashed-password",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRequest = {
      body: {},
      query: {},
      params: {},
      authContext: {
        user: mockUser,
      },
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    orderController = new OrderController(mockOrderService);
  });

  describe("createOrder", () => {
    it("should create an order successfully", async () => {
      const orderInput = createMockOrderInput();
      const orderId = new Types.ObjectId();
      const now = new Date();

      const mockOrder: IOrder = {
        id: orderId,
        ...orderInput,
        services: orderInput.services.map((service) => ({
          ...service,
          id: new Types.ObjectId(),
          status: ENUMOrderServiceStatus.PENDING,
          createdAt: now,
          updatedAt: now,
        })),
        userId: mockUser.id,
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      };

      mockRequest.body = orderInput;
      vi.mocked(mockOrderService.createOrder).mockResolvedValue(mockOrder);

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        orderInput,
        mockUser
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockOrder);
    });

    it("should throw ZodError when body is invalid", async () => {
      mockRequest.body = {
        labName: "AB", // too short
        patientName: "John Doe",
        clinicName: "Clinic",
        expiresAt: new Date(),
        services: [],
      };

      await expect(
        orderController.createOrder(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(ZodError);

      expect(mockOrderService.createOrder).not.toHaveBeenCalled();
    });

    it("should propagate errors from OrderService", async () => {
      const orderInput = createMockOrderInput();
      const error = new BadRequestError("Services are required", {
        origin: "OrderService.createOrder",
      });

      mockRequest.body = orderInput;
      vi.mocked(mockOrderService.createOrder).mockRejectedValue(error);

      await expect(
        orderController.createOrder(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        orderInput,
        mockUser
      );
    });
  });

  describe("getOrders", () => {
    it("should get orders successfully with default pagination", async () => {
      const mockPagination: IOrderPagination = {
        orders: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockRequest.query = {};
      vi.mocked(mockOrderService.getOrders).mockResolvedValue(mockPagination);

      await orderController.getOrders(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrderService.getOrders).toHaveBeenCalledWith(mockUser, {
        page: 1,
        limit: 50,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockPagination);
    });

    it("should get orders successfully with custom pagination", async () => {
      const mockPagination: IOrderPagination = {
        orders: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: true,
      };

      mockRequest.query = { page: "2", limit: "10" };
      vi.mocked(mockOrderService.getOrders).mockResolvedValue(mockPagination);

      await orderController.getOrders(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrderService.getOrders).toHaveBeenCalledWith(mockUser, {
        page: 2,
        limit: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockPagination);
    });

    it("should get orders successfully with stage filter", async () => {
      const mockPagination: IOrderPagination = {
        orders: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockRequest.query = { stage: ENUMOrderStage.CREATED };
      vi.mocked(mockOrderService.getOrders).mockResolvedValue(mockPagination);

      await orderController.getOrders(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrderService.getOrders).toHaveBeenCalledWith(mockUser, {
        page: 1,
        limit: 50,
        stage: ENUMOrderStage.CREATED,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockPagination);
    });

    it("should throw ZodError when query is invalid", async () => {
      mockRequest.query = { page: "0", limit: "-1" };

      await expect(
        orderController.getOrders(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(ZodError);

      expect(mockOrderService.getOrders).not.toHaveBeenCalled();
    });
  });

  describe("getOrderById", () => {
    it("should get order by id successfully", async () => {
      const orderId = new Types.ObjectId();
      const now = new Date();
      const orderInput = createMockOrderInput();

      const mockOrder: IOrder = {
        id: orderId,
        ...orderInput,
        services: orderInput.services.map((service) => ({
          ...service,
          id: new Types.ObjectId(),
          status: ENUMOrderServiceStatus.PENDING,
          createdAt: now,
          updatedAt: now,
        })),
        userId: mockUser.id,
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      };

      mockRequest.params = { orderId: orderId.toString() };
      vi.mocked(mockOrderService.getOrderById).mockResolvedValue(mockOrder);

      await orderController.getOrderById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(
        orderId,
        mockUser
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockOrder);
    });

    it("should throw BadRequestError when orderId is invalid", async () => {
      mockRequest.params = { orderId: "invalid-id" };

      await expect(
        orderController.getOrderById(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);

      expect(mockOrderService.getOrderById).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError when orderId is missing", async () => {
      mockRequest.params = {};

      await expect(
        orderController.getOrderById(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);

      expect(mockOrderService.getOrderById).not.toHaveBeenCalled();
    });

    it("should propagate NotFoundError from OrderService", async () => {
      const orderId = new Types.ObjectId();
      const error = new NotFoundError("Order not found", {
        origin: "OrderService.getOrderById",
        orderId,
      });

      mockRequest.params = { orderId: orderId.toString() };
      vi.mocked(mockOrderService.getOrderById).mockRejectedValue(error);

      await expect(
        orderController.getOrderById(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(
        orderId,
        mockUser
      );
    });
  });

  describe("updateOrder", () => {
    it("should update an order successfully", async () => {
      const orderId = new Types.ObjectId();
      const now = new Date();
      const orderInput = createMockOrderInput();
      const updateData = {
        labName: "Updated Lab Name",
      };

      const mockOrder: IOrder = {
        id: orderId,
        ...orderInput,
        ...updateData,
        services: orderInput.services.map((service) => ({
          ...service,
          id: new Types.ObjectId(),
          status: ENUMOrderServiceStatus.PENDING,
          createdAt: now,
          updatedAt: now,
        })),
        userId: mockUser.id,
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      };

      mockRequest.params = { orderId: orderId.toString() };
      mockRequest.body = updateData;
      vi.mocked(mockOrderService.updateOrder).mockResolvedValue(mockOrder);

      await orderController.updateOrder(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrderService.updateOrder).toHaveBeenCalledWith(
        orderId,
        mockUser,
        updateData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockOrder);
    });

    it("should throw BadRequestError when orderId is invalid", async () => {
      mockRequest.params = { orderId: "invalid-id" };
      mockRequest.body = { labName: "Updated Lab" };

      await expect(
        orderController.updateOrder(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);

      expect(mockOrderService.updateOrder).not.toHaveBeenCalled();
    });

    it("should throw ZodError when body is invalid", async () => {
      const orderId = new Types.ObjectId();
      mockRequest.params = { orderId: orderId.toString() };
      mockRequest.body = { labName: "AB" }; // too short

      await expect(
        orderController.updateOrder(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(ZodError);

      expect(mockOrderService.updateOrder).not.toHaveBeenCalled();
    });

    it("should propagate NotFoundError from OrderService", async () => {
      const orderId = new Types.ObjectId();
      const updateData = { labName: "Updated Lab Name" };
      const error = new NotFoundError("Order not found", {
        origin: "OrderService.updateOrder",
        orderId,
      });

      mockRequest.params = { orderId: orderId.toString() };
      mockRequest.body = updateData;
      vi.mocked(mockOrderService.updateOrder).mockRejectedValue(error);

      await expect(
        orderController.updateOrder(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderService.updateOrder).toHaveBeenCalledWith(
        orderId,
        mockUser,
        updateData
      );
    });
  });

  describe("advanceOrderStage", () => {
    it("should advance order stage successfully", async () => {
      const orderId = new Types.ObjectId();
      const now = new Date();
      const orderInput = createMockOrderInput();

      const mockOrder: IOrder = {
        id: orderId,
        ...orderInput,
        services: orderInput.services.map((service) => ({
          ...service,
          id: new Types.ObjectId(),
          status: ENUMOrderServiceStatus.PENDING,
          createdAt: now,
          updatedAt: now,
        })),
        userId: mockUser.id,
        stage: ENUMOrderStage.ANALYSIS,
        status: ENUMOrderStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      };

      mockRequest.params = { orderId: orderId.toString() };
      vi.mocked(mockOrderService.advanceOrderStage).mockResolvedValue(
        mockOrder
      );

      await orderController.advanceOrderStage(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrderService.advanceOrderStage).toHaveBeenCalledWith(
        orderId,
        mockUser
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockOrder);
    });

    it("should throw BadRequestError when orderId is invalid", async () => {
      mockRequest.params = { orderId: "invalid-id" };

      await expect(
        orderController.advanceOrderStage(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);

      expect(mockOrderService.advanceOrderStage).not.toHaveBeenCalled();
    });

    it("should propagate NotFoundError from OrderService", async () => {
      const orderId = new Types.ObjectId();
      const error = new NotFoundError("Order not found", {
        origin: "OrderService.advanceOrderStage",
        orderId,
      });

      mockRequest.params = { orderId: orderId.toString() };
      vi.mocked(mockOrderService.advanceOrderStage).mockRejectedValue(error);

      await expect(
        orderController.advanceOrderStage(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderService.advanceOrderStage).toHaveBeenCalledWith(
        orderId,
        mockUser
      );
    });

    it("should propagate BadRequestError when cannot advance stage", async () => {
      const orderId = new Types.ObjectId();
      const error = new BadRequestError("Cannot advance from stage completed", {
        origin: "OrderService.advanceOrderStage",
        orderId,
      });

      mockRequest.params = { orderId: orderId.toString() };
      vi.mocked(mockOrderService.advanceOrderStage).mockRejectedValue(error);

      await expect(
        orderController.advanceOrderStage(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);

      expect(mockOrderService.advanceOrderStage).toHaveBeenCalledWith(
        orderId,
        mockUser
      );
    });
  });

  describe("createService", () => {
    it("should create a service successfully", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const serviceInput = createMockServiceInput();
      const now = new Date();

      const mockService: IOrderService = {
        id: serviceId,
        ...serviceInput,
        status: ENUMOrderServiceStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };

      mockRequest.params = { orderId: orderId.toString() };
      mockRequest.body = serviceInput;
      vi.mocked(mockOrderService.createService).mockResolvedValue(mockService);

      await orderController.createService(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrderService.createService).toHaveBeenCalledWith(
        orderId,
        mockUser,
        serviceInput
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockService);
    });

    it("should throw BadRequestError when orderId is invalid", async () => {
      mockRequest.params = { orderId: "invalid-id" };
      mockRequest.body = createMockServiceInput();

      await expect(
        orderController.createService(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);

      expect(mockOrderService.createService).not.toHaveBeenCalled();
    });

    it("should throw ZodError when body is invalid", async () => {
      const orderId = new Types.ObjectId();
      mockRequest.params = { orderId: orderId.toString() };
      mockRequest.body = { name: "AB", value: -1 }; // invalid

      await expect(
        orderController.createService(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(ZodError);

      expect(mockOrderService.createService).not.toHaveBeenCalled();
    });

    it("should propagate NotFoundError from OrderService", async () => {
      const orderId = new Types.ObjectId();
      const serviceInput = createMockServiceInput();
      const error = new NotFoundError("Order not found", {
        origin: "OrderService.createService",
        orderId,
      });

      mockRequest.params = { orderId: orderId.toString() };
      mockRequest.body = serviceInput;
      vi.mocked(mockOrderService.createService).mockRejectedValue(error);

      await expect(
        orderController.createService(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderService.createService).toHaveBeenCalledWith(
        orderId,
        mockUser,
        serviceInput
      );
    });
  });

  describe("updateService", () => {
    it("should update a service successfully", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();
      const updateData = {
        name: "Updated Service Name",
        value: 150,
      };

      const mockService: IOrderService = {
        id: serviceId,
        name: updateData.name,
        value: updateData.value,
        status: ENUMOrderServiceStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };

      mockRequest.params = {
        orderId: orderId.toString(),
        serviceId: serviceId.toString(),
      };
      mockRequest.body = updateData;
      vi.mocked(mockOrderService.updateService).mockResolvedValue(mockService);

      await orderController.updateService(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrderService.updateService).toHaveBeenCalledWith(
        orderId,
        serviceId,
        mockUser,
        updateData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockService);
    });

    it("should throw BadRequestError when orderId is invalid", async () => {
      const serviceId = new Types.ObjectId();
      mockRequest.params = {
        orderId: "invalid-id",
        serviceId: serviceId.toString(),
      };
      mockRequest.body = { name: "Updated Service" };

      await expect(
        orderController.updateService(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);

      expect(mockOrderService.updateService).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError when serviceId is invalid", async () => {
      const orderId = new Types.ObjectId();
      mockRequest.params = {
        orderId: orderId.toString(),
        serviceId: "invalid-id",
      };
      mockRequest.body = { name: "Updated Service" };

      await expect(
        orderController.updateService(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);

      expect(mockOrderService.updateService).not.toHaveBeenCalled();
    });

    it("should throw ZodError when body is invalid", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      mockRequest.params = {
        orderId: orderId.toString(),
        serviceId: serviceId.toString(),
      };
      mockRequest.body = { name: "AB", value: -1 }; // invalid

      await expect(
        orderController.updateService(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(ZodError);

      expect(mockOrderService.updateService).not.toHaveBeenCalled();
    });

    it("should propagate NotFoundError from OrderService", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const updateData = { name: "Updated Service Name" };
      const error = new NotFoundError("Service not found", {
        origin: "OrderService.updateService",
        orderId,
        serviceId,
      });

      mockRequest.params = {
        orderId: orderId.toString(),
        serviceId: serviceId.toString(),
      };
      mockRequest.body = updateData;
      vi.mocked(mockOrderService.updateService).mockRejectedValue(error);

      await expect(
        orderController.updateService(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderService.updateService).toHaveBeenCalledWith(
        orderId,
        serviceId,
        mockUser,
        updateData
      );
    });
  });
});
