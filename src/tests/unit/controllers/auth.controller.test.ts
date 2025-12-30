import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { ZodError } from "zod";

import { BadRequestError, UnauthorizedError } from "../../../shared/app-error";
import { AuthController } from "../../../modules/auth/auth.controller";
import type { AuthService } from "../../../modules/auth/auth.service";
import type { IAuthUser } from "../../../modules/auth/auth.type";
import { createMockUserInput } from "../../mocks/user.mock";

describe("AuthController - Unit Tests", () => {
  let authController: AuthController;
  let mockAuthService: AuthService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create mocks
    mockAuthService = {
      registerUser: vi.fn(),
      loginUser: vi.fn(),
    } as unknown as AuthService;

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    authController = new AuthController(mockAuthService);
  });

  describe("register", () => {
    it("should register a user successfully", async () => {
      const userInput = createMockUserInput();
      const userId = new Types.ObjectId();
      const mockAuthUser: IAuthUser = {
        token: "mock-jwt-token",
        user: {
          id: userId,
          email: userInput.email,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockRequest.body = userInput;
      vi.mocked(mockAuthService.registerUser).mockResolvedValue(mockAuthUser);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.registerUser).toHaveBeenCalledWith(userInput);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAuthUser);
    });

    it("should throw ZodError when body is invalid", async () => {
      mockRequest.body = {
        email: "invalid-email",
        password: "123", // too short
      };

      await expect(
        authController.register(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(ZodError);

      expect(mockAuthService.registerUser).not.toHaveBeenCalled();
    });

    it("should throw ZodError when body is missing required fields", async () => {
      mockRequest.body = {};

      await expect(
        authController.register(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(ZodError);

      expect(mockAuthService.registerUser).not.toHaveBeenCalled();
    });

    it("should propagate errors from AuthService", async () => {
      const userInput = createMockUserInput();
      const error = new BadRequestError("Email already exists", {
        origin: "AuthService.registerUser",
      });

      mockRequest.body = userInput;
      vi.mocked(mockAuthService.registerUser).mockRejectedValue(error);

      await expect(
        authController.register(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);

      expect(mockAuthService.registerUser).toHaveBeenCalledWith(userInput);
    });
  });

  describe("login", () => {
    it("should login a user successfully", async () => {
      const userInput = createMockUserInput();
      const userId = new Types.ObjectId();
      const mockAuthUser: IAuthUser = {
        token: "mock-jwt-token",
        user: {
          id: userId,
          email: userInput.email,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockRequest.body = userInput;
      vi.mocked(mockAuthService.loginUser).mockResolvedValue(mockAuthUser);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.loginUser).toHaveBeenCalledWith(userInput);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAuthUser);
    });

    it("should throw ZodError when body is invalid", async () => {
      mockRequest.body = {
        email: "invalid-email",
        password: "123", // too short
      };

      await expect(
        authController.login(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(ZodError);

      expect(mockAuthService.loginUser).not.toHaveBeenCalled();
    });

    it("should throw ZodError when body is missing required fields", async () => {
      mockRequest.body = {};

      await expect(
        authController.login(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(ZodError);

      expect(mockAuthService.loginUser).not.toHaveBeenCalled();
    });

    it("should propagate UnauthorizedError from AuthService", async () => {
      const userInput = createMockUserInput();
      const error = new UnauthorizedError("Invalid email or password", {
        origin: "AuthService.loginUser",
      });

      mockRequest.body = userInput;
      vi.mocked(mockAuthService.loginUser).mockRejectedValue(error);

      await expect(
        authController.login(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(UnauthorizedError);

      expect(mockAuthService.loginUser).toHaveBeenCalledWith(userInput);
    });
  });
});
