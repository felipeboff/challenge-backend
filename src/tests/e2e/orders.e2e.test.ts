import { Types } from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import app from "../../app";
import {
  ENUMOrderStage,
  ENUMOrderStatus,
} from "../../modules/orders/order.type";
import {
  createMockOrderInput,
  createMockServiceInput,
} from "../mocks/order.mock";
import { createAuthenticatedUser } from "./helpers/auth.helper";

describe("Orders E2E Tests", () => {
  let authToken: string;
  let userId: string;
  let secondUserToken: string;

  beforeEach(async () => {
    // Create authenticated user
    const auth = await createAuthenticatedUser();
    authToken = auth.token;
    userId = auth.userId;

    // Create second user for isolation tests
    const secondAuth = await createAuthenticatedUser();
    secondUserToken = secondAuth.token;
  });

  describe("POST /api/orders", () => {
    it("should create an order successfully", async () => {
      const orderData = createMockOrderInput();

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("labName", orderData.labName);
      expect(response.body).toHaveProperty(
        "patientName",
        orderData.patientName
      );
      expect(response.body).toHaveProperty("clinicName", orderData.clinicName);
      expect(response.body).toHaveProperty("stage", ENUMOrderStage.CREATED);
      expect(response.body).toHaveProperty("status", ENUMOrderStatus.ACTIVE);
      expect(response.body).toHaveProperty("userId", userId);
      expect(response.body).toHaveProperty("services");
      expect(response.body.services).toHaveLength(orderData.services.length);
      expect(response.body.services[0]).toHaveProperty("status", "pending");
    });

    it("should return 401 when token is missing", async () => {
      const orderData = createMockOrderInput();

      const response = await request(app)
        .post("/api/orders")
        .send(orderData)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 401 when token is invalid", async () => {
      const orderData = createMockOrderInput();

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", "Bearer invalid-token")
        .send(orderData)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when labName is too short", async () => {
      const orderData = createMockOrderInput({ labName: "ab" });

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when patientName is too short", async () => {
      const orderData = createMockOrderInput({ patientName: "ab" });

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when clinicName is too short", async () => {
      const orderData = createMockOrderInput({ clinicName: "ab" });

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when services array is empty", async () => {
      const orderData = createMockOrderInput({ services: [] });

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when service name is too short", async () => {
      const orderData = createMockOrderInput({
        services: [createMockServiceInput({ name: "ab" })],
      });

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when service value is negative", async () => {
      const orderData = createMockOrderInput({
        services: [createMockServiceInput({ value: -1 })],
      });

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when expiresAt is invalid", async () => {
      const orderData = createMockOrderInput();
      // @ts-expect-error - Invalid date for testing
      orderData.expiresAt = "invalid-date";

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });
  });

  describe("GET /api/orders", () => {
    it("should get orders successfully with default pagination", async () => {
      // Create multiple orders
      const orderData1 = createMockOrderInput();
      const orderData2 = createMockOrderInput();

      await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData1)
        .expect(201);

      await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData2)
        .expect(201);

      const response = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("orders");
      expect(response.body).toHaveProperty("total", 2);
      expect(response.body).toHaveProperty("page", 1);
      expect(response.body).toHaveProperty("limit", 50);
      expect(response.body).toHaveProperty("totalPages", 1);
      expect(response.body).toHaveProperty("hasNextPage", false);
      expect(response.body).toHaveProperty("hasPreviousPage", false);
      expect(response.body.orders).toHaveLength(2);
    });

    it("should get orders with pagination", async () => {
      // Create multiple orders
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post("/api/orders")
          .set("Authorization", `Bearer ${authToken}`)
          .send(createMockOrderInput())
          .expect(201);
      }

      const response = await request(app)
        .get("/api/orders?page=1&limit=2")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("orders");
      expect(response.body.orders).toHaveLength(2);
      expect(response.body).toHaveProperty("total", 3);
      expect(response.body).toHaveProperty("page", 1);
      expect(response.body).toHaveProperty("limit", 2);
      expect(response.body).toHaveProperty("hasNextPage", true);
    });

    it("should filter orders by stage", async () => {
      // Create orders
      await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(createMockOrderInput())
        .expect(201);

      const response = await request(app)
        .get("/api/orders?stage=created")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0]).toHaveProperty(
        "stage",
        ENUMOrderStage.CREATED
      );
    });

    it("should only return orders from the authenticated user", async () => {
      // Create order for first user
      await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(createMockOrderInput())
        .expect(201);

      // Create order for second user
      await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${secondUserToken}`)
        .send(createMockOrderInput())
        .expect(201);

      // Get orders for first user
      const response = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].userId).toBe(userId);
    });

    it("should return 401 when token is missing", async () => {
      const response = await request(app).get("/api/orders").expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when page is invalid", async () => {
      const response = await request(app)
        .get("/api/orders?page=0")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when limit is invalid", async () => {
      const response = await request(app)
        .get("/api/orders?limit=0")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when stage is invalid", async () => {
      const response = await request(app)
        .get("/api/orders?stage=invalid")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });
  });

  describe("GET /api/orders/:orderId", () => {
    it("should get order by id successfully", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", orderId);
      expect(response.body).toHaveProperty("labName", orderData.labName);
      expect(response.body).toHaveProperty(
        "patientName",
        orderData.patientName
      );
    });

    it("should return 404 when order does not exist", async () => {
      const fakeId = new Types.ObjectId().toString();

      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 when order belongs to another user", async () => {
      // Create order for second user
      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${secondUserToken}`)
        .send(createMockOrderInput())
        .expect(201);

      const orderId = createResponse.body.id;

      // Try to get order with first user token
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when orderId is invalid", async () => {
      const response = await request(app)
        .get("/api/orders/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 401 when token is missing", async () => {
      const fakeId = new Types.ObjectId().toString();

      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PUT /api/orders/:orderId", () => {
    it("should update order successfully", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;

      const updateData = {
        ...createResponse.body,
        labName: "Updated Lab Name",
        patientName: "Updated Patient Name",
      };

      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("id", orderId);
      expect(response.body).toHaveProperty("labName", updateData.labName);
      expect(response.body).toHaveProperty(
        "patientName",
        updateData.patientName
      );
    });

    it("should return 404 when order does not exist", async () => {
      const fakeId = new Types.ObjectId().toString();

      const response = await request(app)
        .put(`/api/orders/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ labName: "Updated" })
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 when order belongs to another user", async () => {
      // Create order for second user
      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${secondUserToken}`)
        .send(createMockOrderInput())
        .expect(201);

      const orderId = createResponse.body.id;

      // Try to update order with first user token
      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ labName: "Updated" })
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when orderId is invalid", async () => {
      const response = await request(app)
        .put("/api/orders/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ labName: "Updated" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when labName is too short", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ labName: "ab" })
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 401 when token is missing", async () => {
      const fakeId = new Types.ObjectId().toString();

      const response = await request(app)
        .put(`/api/orders/${fakeId}`)
        .send({ labName: "Updated" })
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/orders/:orderId/advance", () => {
    it("should advance order stage from CREATED to ANALYSIS", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;
      expect(createResponse.body.stage).toBe(ENUMOrderStage.CREATED);

      const response = await request(app)
        .post(`/api/orders/${orderId}/advance`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", orderId);
      expect(response.body).toHaveProperty("stage", ENUMOrderStage.ANALYSIS);
    });

    it("should advance order stage from ANALYSIS to COMPLETED", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;

      // Advance to ANALYSIS
      await request(app)
        .post(`/api/orders/${orderId}/advance`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Advance to COMPLETED
      const response = await request(app)
        .post(`/api/orders/${orderId}/advance`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("stage", ENUMOrderStage.COMPLETED);
    });

    it("should return 400 when order is already in final stage", async () => {
      const orderData = createMockOrderInput();

      // Advance to CREATED
      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;

      // Advance to ANALYSIS
      const analysisResponse = await request(app)
        .post(`/api/orders/${orderId}/advance`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Advance to COMPLETED
      const completedResponse = await request(app)
        .post(`/api/orders/${orderId}/advance`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Try to advance again
      const response = await request(app)
        .post(`/api/orders/${orderId}/advance`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 when order does not exist", async () => {
      const fakeId = new Types.ObjectId().toString();

      const response = await request(app)
        .post(`/api/orders/${fakeId}/advance`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 when order belongs to another user", async () => {
      // Create order for second user
      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${secondUserToken}`)
        .send(createMockOrderInput())
        .expect(201);

      const orderId = createResponse.body.id;

      // Try to advance order with first user token
      const response = await request(app)
        .post(`/api/orders/${orderId}/advance`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when orderId is invalid", async () => {
      const response = await request(app)
        .post("/api/orders/invalid-id/advance")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 401 when token is missing", async () => {
      const fakeId = new Types.ObjectId().toString();

      const response = await request(app)
        .post(`/api/orders/${fakeId}/advance`)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/orders/:orderId/services", () => {
    it("should create a service successfully", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;
      const initialServicesCount = createResponse.body.services.length;

      const serviceData = createMockServiceInput();

      const response = await request(app)
        .post(`/api/orders/${orderId}/services`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(serviceData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name", serviceData.name);
      expect(response.body).toHaveProperty("value", serviceData.value);
      expect(response.body).toHaveProperty("status", "pending");

      // Verify service was added to order
      const getResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.services).toHaveLength(initialServicesCount + 1);
    });

    it("should return 404 when order does not exist", async () => {
      const fakeId = new Types.ObjectId().toString();
      const serviceData = createMockServiceInput();

      const response = await request(app)
        .post(`/api/orders/${fakeId}/services`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(serviceData)
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 when order belongs to another user", async () => {
      // Create order for second user
      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${secondUserToken}`)
        .send(createMockOrderInput())
        .expect(201);

      const orderId = createResponse.body.id;
      const serviceData = createMockServiceInput();

      // Try to create service with first user token
      const response = await request(app)
        .post(`/api/orders/${orderId}/services`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(serviceData)
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when service name is too short", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/orders/${orderId}/services`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "ab", value: 100 })
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when service value is negative", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/orders/${orderId}/services`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Service Name", value: -1 })
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when orderId is invalid", async () => {
      const serviceData = createMockServiceInput();

      const response = await request(app)
        .post("/api/orders/invalid-id/services")
        .set("Authorization", `Bearer ${authToken}`)
        .send(serviceData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 401 when token is missing", async () => {
      const fakeId = new Types.ObjectId().toString();
      const serviceData = createMockServiceInput();

      const response = await request(app)
        .post(`/api/orders/${fakeId}/services`)
        .send(serviceData)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PUT /api/orders/:orderId/services/:serviceId", () => {
    it("should update a service successfully", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;
      const serviceId = createResponse.body.services[0].id;

      const updateData = {
        ...createResponse.body.services[0],
        name: "Updated Service Name",
        value: 999.99,
      };

      const response = await request(app)
        .put(`/api/orders/${orderId}/services/${serviceId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("id", serviceId);
      expect(response.body).toHaveProperty("name", updateData.name);
      expect(response.body).toHaveProperty("value", updateData.value);
    });

    it("should update service status", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;
      const serviceId = createResponse.body.services[0].id;

      const response = await request(app)
        .put(`/api/orders/${orderId}/services/${serviceId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ status: "done" })
        .expect(200);

      expect(response.body).toHaveProperty("status", "done");
    });

    it("should return 404 when order does not exist", async () => {
      const fakeOrderId = new Types.ObjectId().toString();
      const fakeServiceId = new Types.ObjectId().toString();

      const response = await request(app)
        .put(`/api/orders/${fakeOrderId}/services/${fakeServiceId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated" })
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 when service does not exist", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;
      const fakeServiceId = new Types.ObjectId().toString();

      const response = await request(app)
        .put(`/api/orders/${orderId}/services/${fakeServiceId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated" })
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 when order belongs to another user", async () => {
      // Create order for second user
      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${secondUserToken}`)
        .send(createMockOrderInput())
        .expect(201);

      const orderId = createResponse.body.id;
      const serviceId = createResponse.body.services[0].id;

      // Try to update service with first user token
      const response = await request(app)
        .put(`/api/orders/${orderId}/services/${serviceId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated" })
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when orderId is invalid", async () => {
      const fakeServiceId = new Types.ObjectId().toString();

      const response = await request(app)
        .put(`/api/orders/invalid-id/services/${fakeServiceId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when serviceId is invalid", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/orders/${orderId}/services/invalid-id`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when service name is too short", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;
      const serviceId = createResponse.body.services[0].id;

      const response = await request(app)
        .put(`/api/orders/${orderId}/services/${serviceId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "ab" })
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when service value is negative", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;
      const serviceId = createResponse.body.services[0].id;

      const response = await request(app)
        .put(`/api/orders/${orderId}/services/${serviceId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ value: -1 })
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when service status is invalid", async () => {
      const orderData = createMockOrderInput();

      const createResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;
      const serviceId = createResponse.body.services[0].id;

      const response = await request(app)
        .put(`/api/orders/${orderId}/services/${serviceId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ status: "invalid-status" })
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 401 when token is missing", async () => {
      const fakeOrderId = new Types.ObjectId().toString();
      const fakeServiceId = new Types.ObjectId().toString();

      const response = await request(app)
        .put(`/api/orders/${fakeOrderId}/services/${fakeServiceId}`)
        .send({ name: "Updated" })
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });
});
