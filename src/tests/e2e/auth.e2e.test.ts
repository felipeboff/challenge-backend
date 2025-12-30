import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../app";
import { createMockUserInput } from "../mocks/user.mock";

describe("Auth E2E Tests", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = createMockUserInput();

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("email", userData.email);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 400 when email is invalid", async () => {
      const userData = createMockUserInput({ email: "invalid-email" });

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when password is too short", async () => {
      const userData = createMockUserInput({ password: "short" });

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when email already exists", async () => {
      const userData = createMockUserInput();

      // Create first user
      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Try to create user with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when body is empty", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const userData = createMockUserInput();

      // Register user first
      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Login
      const response = await request(app)
        .post("/api/auth/login")
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("email", userData.email);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 401 when email does not exist", async () => {
      const userData = createMockUserInput();

      const response = await request(app)
        .post("/api/auth/login")
        .send(userData)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 401 when password is incorrect", async () => {
      const userData = createMockUserInput();

      // Register user first
      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Try to login with wrong password
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: userData.email,
          password: "wrongpassword123",
        })
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when email is invalid", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid-email",
          password: "password123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when password is too short", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "short",
        })
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });

    it("should return 400 when body is empty", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });
  });
});
