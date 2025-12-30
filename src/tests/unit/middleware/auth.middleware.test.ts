import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "../../../shared/app-error";
import type { JwtService } from "../../../shared/jwt-service";
import type { UserRepository } from "../../../modules/users/user.repository";
import type { IUser } from "../../../modules/users/user.type";
import { AuthMiddleware } from "../../../middleware/auth.middleware";

describe("AuthMiddleware - Unit Tests", () => {
  let authMiddleware: AuthMiddleware;
  let mockUserRepository: UserRepository;
  let mockJwtService: JwtService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
    } as unknown as UserRepository;

    mockJwtService = {
      verify: vi.fn(),
    } as unknown as JwtService;

    authMiddleware = new AuthMiddleware(mockUserRepository, mockJwtService);

    mockRequest = {
      headers: {},
      path: "/test",
    };

    mockResponse = {};

    mockNext = vi.fn();
  });

  describe("handle", () => {
    it("should throw UnauthorizedError when no token is provided", async () => {
      mockRequest.headers = {};

      await expect(
        authMiddleware.handle(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow(UnauthorizedError);

      await expect(
        authMiddleware.handle(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow("Unauthorized");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when authorization header is missing", async () => {
      mockRequest.headers = {};

      await expect(
        authMiddleware.handle(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow(UnauthorizedError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when token is invalid", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };

      (mockJwtService.verify as ReturnType<typeof vi.fn>).mockReturnValue(null);

      await expect(
        authMiddleware.handle(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow(UnauthorizedError);

      expect(mockJwtService.verify).toHaveBeenCalledWith("invalid-token");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when decoded token has no userId", async () => {
      mockRequest.headers = {
        authorization: "Bearer valid-token",
      };

      (mockJwtService.verify as ReturnType<typeof vi.fn>).mockReturnValue({
        iat: 1234567890,
      } as never);

      await expect(
        authMiddleware.handle(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow(UnauthorizedError);

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when user is not found", async () => {
      const userId = new Types.ObjectId();
      mockRequest.headers = {
        authorization: "Bearer valid-token",
      };

      (mockJwtService.verify as ReturnType<typeof vi.fn>).mockReturnValue({
        userId: userId.toString(),
      } as never);

      (
        mockUserRepository.findById as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null!);

      await expect(
        authMiddleware.handle(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow(UnauthorizedError);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should set authContext and call next when token is valid", async () => {
      const userId = new Types.ObjectId();
      const mockUser: IUser = {
        id: userId,
        email: "test@example.com",
        password: "hashed-password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.headers = {
        authorization: "Bearer valid-token",
      };

      (mockJwtService.verify as ReturnType<typeof vi.fn>).mockReturnValue({
        userId: userId.toString(),
      } as never);

      (
        mockUserRepository.findById as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockUser);

      await authMiddleware.handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockJwtService.verify).toHaveBeenCalledWith("valid-token");
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRequest.authContext).toEqual({ user: mockUser });
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle token without Bearer prefix correctly", async () => {
      mockRequest.headers = {
        authorization: "token-without-bearer",
      };

      await expect(
        authMiddleware.handle(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow(UnauthorizedError);

      expect(mockJwtService.verify).not.toHaveBeenCalled();
    });

    it("should handle empty token string", async () => {
      mockRequest.headers = {
        authorization: "Bearer ",
      };

      (mockJwtService.verify as ReturnType<typeof vi.fn>).mockReturnValue(null);

      await expect(
        authMiddleware.handle(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
