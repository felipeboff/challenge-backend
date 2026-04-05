import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "../../../config/env";
import { JwtService } from "../../../shared/jwt-service";

// Mock jwt module
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe("JwtService - Unit Tests", () => {
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService();
    vi.clearAllMocks();
  });

  describe("sign", () => {
    it("should sign a payload and return a token", () => {
      const payload = { userId: new Types.ObjectId() };
      const mockToken = "mock-jwt-token";

      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      const result = jwtService.sign(payload);

      expect(result).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN_MINUTES * 60,
        algorithm: env.JWT_ALGORITHM,
      });
    });

    it("should return null when sign throws an error", () => {
      const payload = { userId: new Types.ObjectId() };

      vi.mocked(jwt.sign).mockImplementation(() => {
        throw new Error("Sign error");
      });

      const result = jwtService.sign(payload);

      expect(result).toBeNull();
    });
  });

  describe("verify", () => {
    it("should verify a token and return decoded payload", () => {
      const token = "valid-token";
      const userId = new Types.ObjectId();
      const mockDecoded = { userId: userId.toString(), iat: 1234567890 };

      vi.mocked(jwt.verify).mockReturnValue(mockDecoded as never);

      const result = jwtService.verify(token);

      expect(result).toEqual({ userId });
      expect(jwt.verify).toHaveBeenCalledWith(token, env.JWT_SECRET, {
        algorithms: [env.JWT_ALGORITHM],
      });
    });

    it("should return null when token is invalid", () => {
      const token = "invalid-token";

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = jwtService.verify(token);

      expect(result).toBeNull();
    });

    it("should return null when token is expired", () => {
      const token = "expired-token";

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Token expired");
      });

      const result = jwtService.verify(token);

      expect(result).toBeNull();
    });

    it("should return null when token has wrong secret", () => {
      const token = "wrong-secret-token";

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const result = jwtService.verify(token);

      expect(result).toBeNull();
    });
  });
});
