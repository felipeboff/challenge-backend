import bcrypt from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PasswordHash } from "../../../shared/password-hash";
import { env } from "../../../config/env";

// Mock bcrypt module
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe("PasswordHash - Unit Tests", () => {
  let passwordHash: PasswordHash;

  beforeEach(() => {
    passwordHash = new PasswordHash();
    vi.clearAllMocks();
  });

  describe("hash", () => {
    it("should hash a plain text password", async () => {
      const plainText = "password123";
      const mockHash = "hashed-password";

      vi.mocked(bcrypt.hash).mockResolvedValue(mockHash as never);

      const result = await passwordHash.hash(plainText);

      expect(result).toBe(mockHash);
      expect(bcrypt.hash).toHaveBeenCalledWith(
        plainText + env.PASSWORD_SECRET,
        env.PASSWORD_SALT
      );
    });

    it("should throw error when bcrypt.hash fails", async () => {
      const plainText = "password123";

      vi.mocked(bcrypt.hash).mockRejectedValue(new Error("Hash error"));

      await expect(passwordHash.hash(plainText)).rejects.toThrow("Hash error");
    });
  });

  describe("compare", () => {
    it("should return true when password matches", async () => {
      const plainText = "password123";
      const hash = "hashed-password";

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await passwordHash.compare(plainText, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainText + env.PASSWORD_SECRET,
        hash
      );
    });

    it("should return false when password does not match", async () => {
      const plainText = "password123";
      const hash = "hashed-password";

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await passwordHash.compare(plainText, hash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainText + env.PASSWORD_SECRET,
        hash
      );
    });

    it("should throw error when bcrypt.compare fails", async () => {
      const plainText = "password123";
      const hash = "hashed-password";

      vi.mocked(bcrypt.compare).mockRejectedValue(new Error("Compare error"));

      await expect(passwordHash.compare(plainText, hash)).rejects.toThrow(
        "Compare error"
      );
    });
  });
});
