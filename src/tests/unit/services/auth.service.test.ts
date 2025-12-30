import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  InternalServerError,
  UnauthorizedError,
} from "../../../shared/app-error";
import type { JwtService } from "../../../shared/jwt-service";
import type { PasswordHash } from "../../../shared/password-hash";
import { AuthService } from "../../../modules/auth/auth.service";
import type { UserRepository } from "../../../modules/users/user.repository";
import type { UserService } from "../../../modules/users/user.service";
import type { IUser, IUserSafe } from "../../../modules/users/user.type";
import { createMockUserInput } from "../../mocks/user.mock";

describe("AuthService - Unit Tests", () => {
  let authService: AuthService;
  let mockUserRepository: UserRepository;
  let mockUserService: UserService;
  let mockJwtService: JwtService;
  let mockPasswordHash: PasswordHash;

  beforeEach(() => {
    // Create mocks
    mockUserRepository = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    } as unknown as UserRepository;

    mockUserService = {
      createUser: vi.fn(),
      getUserByEmail: vi.fn(),
      getUserById: vi.fn(),
    } as unknown as UserService;

    mockJwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
    } as unknown as JwtService;

    mockPasswordHash = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as PasswordHash;

    authService = new AuthService(
      mockUserRepository,
      mockUserService,
      mockJwtService,
      mockPasswordHash
    );
  });

  describe("registerUser", () => {
    it("should register a user successfully and return token", async () => {
      const userInput = createMockUserInput();
      const userId = new Types.ObjectId();
      const mockUser: IUserSafe = {
        id: userId,
        email: userInput.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockToken = "mock-jwt-token";

      vi.mocked(mockUserService.createUser).mockResolvedValue(mockUser);
      vi.mocked(mockJwtService.sign).mockReturnValue(mockToken);

      const result = await authService.registerUser(userInput);

      expect(mockUserService.createUser).toHaveBeenCalledWith(userInput);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: userId.toString(),
      });
      expect(result).toEqual({
        token: mockToken,
        user: mockUser,
      });
      expect(result.user).not.toHaveProperty("password");
    });

    it("should throw InternalServerError when token generation fails", async () => {
      const userInput = createMockUserInput();
      const userId = new Types.ObjectId();
      const mockUser: IUserSafe = {
        id: userId,
        email: userInput.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockUserService.createUser).mockResolvedValue(mockUser);
      vi.mocked(mockJwtService.sign).mockReturnValue(null);

      await expect(authService.registerUser(userInput)).rejects.toThrow(
        InternalServerError
      );
      await expect(authService.registerUser(userInput)).rejects.toThrow(
        "Failed to generate token"
      );

      expect(mockUserService.createUser).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it("should propagate errors from UserService.createUser", async () => {
      const userInput = createMockUserInput();
      const error = new Error("Email already exists");

      vi.mocked(mockUserService.createUser).mockRejectedValue(error);

      await expect(authService.registerUser(userInput)).rejects.toThrow(error);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe("loginUser", () => {
    it("should login successfully with valid credentials", async () => {
      const userInput = createMockUserInput();
      const userId = new Types.ObjectId();
      const hashedPassword = "hashed-password";
      const mockUser: IUser = {
        id: userId,
        email: userInput.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSafeUser: IUserSafe = {
        id: userId,
        email: userInput.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };
      const mockToken = "mock-jwt-token";

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordHash.compare).mockResolvedValue(true);
      vi.mocked(mockJwtService.sign).mockReturnValue(mockToken);

      const result = await authService.loginUser(userInput);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        userInput.email
      );
      expect(mockPasswordHash.compare).toHaveBeenCalledWith(
        userInput.password,
        hashedPassword
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: userId.toString(),
      });
      expect(result).toEqual({
        token: mockToken,
        user: mockSafeUser,
      });
      expect(result.user).not.toHaveProperty("password");
    });

    it("should throw UnauthorizedError when user is not found", async () => {
      const userInput = createMockUserInput();

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      await expect(authService.loginUser(userInput)).rejects.toThrow(
        UnauthorizedError
      );
      await expect(authService.loginUser(userInput)).rejects.toThrow(
        "Invalid email or password"
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        userInput.email
      );
      expect(mockPasswordHash.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when password is incorrect", async () => {
      const userInput = createMockUserInput();
      const userId = new Types.ObjectId();
      const hashedPassword = "hashed-password";
      const mockUser: IUser = {
        id: userId,
        email: userInput.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordHash.compare).mockResolvedValue(false);

      await expect(authService.loginUser(userInput)).rejects.toThrow(
        UnauthorizedError
      );
      await expect(authService.loginUser(userInput)).rejects.toThrow(
        "Invalid email or password"
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        userInput.email
      );
      expect(mockPasswordHash.compare).toHaveBeenCalledWith(
        userInput.password,
        hashedPassword
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it("should throw InternalServerError when token generation fails", async () => {
      const userInput = createMockUserInput();
      const userId = new Types.ObjectId();
      const hashedPassword = "hashed-password";
      const mockUser: IUser = {
        id: userId,
        email: userInput.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordHash.compare).mockResolvedValue(true);
      vi.mocked(mockJwtService.sign).mockReturnValue(null);

      await expect(authService.loginUser(userInput)).rejects.toThrow(
        InternalServerError
      );
      await expect(authService.loginUser(userInput)).rejects.toThrow(
        "Failed to generate token"
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockPasswordHash.compare).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it("should not expose password in returned user object", async () => {
      const userInput = createMockUserInput();
      const userId = new Types.ObjectId();
      const hashedPassword = "hashed-password";
      const mockUser: IUser = {
        id: userId,
        email: userInput.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockToken = "mock-jwt-token";

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordHash.compare).mockResolvedValue(true);
      vi.mocked(mockJwtService.sign).mockReturnValue(mockToken);

      const result = await authService.loginUser(userInput);

      expect(result.user).not.toHaveProperty("password");
      expect(result.user.id).toEqual(userId);
      expect(result.user.email).toEqual(userInput.email);
    });
  });
});
