import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BadRequestError, NotFoundError } from "../../../shared/app-error";
import type { PasswordHash } from "../../../shared/password-hash";
import { UserService } from "../../../modules/users/user.service";
import type { UserRepository } from "../../../modules/users/user.repository";
import type {
  IUser,
  IUserCreate,
  IUserSafe,
} from "../../../modules/users/user.type";
import { createMockUserInput } from "../../mocks/user.mock";

describe("UserService - Unit Tests", () => {
  let userService: UserService;
  let mockUserRepository: UserRepository;
  let mockPasswordHash: PasswordHash;

  beforeEach(() => {
    // Create mocks
    mockUserRepository = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    } as unknown as UserRepository;

    mockPasswordHash = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as PasswordHash;

    userService = new UserService(mockUserRepository, mockPasswordHash);
  });

  describe("createUser", () => {
    it("should create a user successfully and return safe user without password", async () => {
      const userInput: IUserCreate = createMockUserInput();
      const userId = new Types.ObjectId();
      const hashedPassword = "hashed-password";
      const now = new Date();

      const mockCreatedUser: IUser = {
        id: userId,
        email: userInput.email,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordHash.hash).mockResolvedValue(hashedPassword);
      vi.mocked(mockUserRepository.create).mockResolvedValue(mockCreatedUser);

      const result = await userService.createUser(userInput);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        userInput.email
      );
      expect(mockPasswordHash.hash).toHaveBeenCalledWith(userInput.password);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result).not.toHaveProperty("password");
      expect(result.id).toEqual(userId);
      expect(result.email).toEqual(userInput.email);
      expect(result.createdAt).toEqual(now);
      expect(result.updatedAt).toEqual(now);
    });

    it("should throw BadRequestError when email already exists", async () => {
      const userInput: IUserCreate = createMockUserInput();
      const existingUserId = new Types.ObjectId();
      const existingUser: IUser = {
        id: existingUserId,
        email: userInput.email,
        password: "existing-hashed-password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

      await expect(userService.createUser(userInput)).rejects.toThrow(
        BadRequestError
      );
      await expect(userService.createUser(userInput)).rejects.toThrow(
        BadRequestError
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        userInput.email
      );
      expect(mockPasswordHash.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it("should not expose password in returned user object", async () => {
      const userInput: IUserCreate = createMockUserInput();
      const userId = new Types.ObjectId();
      const hashedPassword = "hashed-password";
      const now = new Date();

      const mockCreatedUser: IUser = {
        id: userId,
        email: userInput.email,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordHash.hash).mockResolvedValue(hashedPassword);
      vi.mocked(mockUserRepository.create).mockResolvedValue(mockCreatedUser);

      const result = await userService.createUser(userInput);

      expect(result).not.toHaveProperty("password");
      expect(Object.keys(result)).toEqual([
        "id",
        "email",
        "createdAt",
        "updatedAt",
      ]);
    });
  });

  describe("getUserByEmail", () => {
    it("should return safe user when user is found", async () => {
      const email = "test@example.com";
      const userId = new Types.ObjectId();
      const hashedPassword = "hashed-password";
      const now = new Date();

      const mockUser: IUser = {
        id: userId,
        email,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail(email);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).not.toHaveProperty("password");
      expect(result.id).toEqual(userId);
      expect(result.email).toEqual(email);
      expect(result.createdAt).toEqual(now);
      expect(result.updatedAt).toEqual(now);
    });

    it("should throw NotFoundError when user is not found", async () => {
      const email = "nonexistent@example.com";

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      await expect(userService.getUserByEmail(email)).rejects.toThrow(
        NotFoundError
      );
      await expect(userService.getUserByEmail(email)).rejects.toThrow(
        "User not found"
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it("should not expose password in returned user object", async () => {
      const email = "test@example.com";
      const userId = new Types.ObjectId();
      const hashedPassword = "hashed-password";

      const mockUser: IUser = {
        id: userId,
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail(email);

      expect(result).not.toHaveProperty("password");
      expect(Object.keys(result)).toEqual([
        "id",
        "email",
        "createdAt",
        "updatedAt",
      ]);
    });
  });

  describe("getUserById", () => {
    it("should return safe user when user is found", async () => {
      const userId = new Types.ObjectId();
      const email = "test@example.com";
      const hashedPassword = "hashed-password";
      const now = new Date();

      const mockUser: IUser = {
        id: userId,
        email,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).not.toHaveProperty("password");
      expect(result.id).toEqual(userId);
      expect(result.email).toEqual(email);
      expect(result.createdAt).toEqual(now);
      expect(result.updatedAt).toEqual(now);
    });

    it("should throw NotFoundError when user is not found", async () => {
      const userId = new Types.ObjectId();
      const notFoundError = new NotFoundError("User not found", {
        origin: "UserRepository.findById",
        userId,
      });

      vi.mocked(mockUserRepository.findById).mockRejectedValue(notFoundError);

      await expect(userService.getUserById(userId)).rejects.toThrow(
        NotFoundError
      );
      await expect(userService.getUserById(userId)).rejects.toThrow(
        "User not found"
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it("should not expose password in returned user object", async () => {
      const userId = new Types.ObjectId();
      const email = "test@example.com";
      const hashedPassword = "hashed-password";

      const mockUser: IUser = {
        id: userId,
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(result).not.toHaveProperty("password");
      expect(Object.keys(result)).toEqual([
        "id",
        "email",
        "createdAt",
        "updatedAt",
      ]);
    });
  });
});
