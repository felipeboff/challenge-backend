import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { transformObjectId } from "../../../shared/transform-object-id";

describe("transformObjectId - Unit Tests", () => {
  describe("valid inputs", () => {
    it("should transform a valid 24-character hex string to ObjectId", () => {
      const validId = "507f1f77bcf86cd799439011";
      const result = transformObjectId(validId);

      expect(result).toBeInstanceOf(Types.ObjectId);
      expect(result?.toString()).toBe(validId);
    });

    it("should return the same ObjectId if input is already an ObjectId", () => {
      const objectId = new Types.ObjectId();
      const result = transformObjectId(objectId);

      expect(result).toBe(objectId);
    });

    it("should handle valid ObjectId with uppercase letters", () => {
      const validId = "507F1F77BCF86CD799439011";
      const result = transformObjectId(validId);

      expect(result).toBeInstanceOf(Types.ObjectId);
    });
  });

  describe("invalid inputs", () => {
    it("should return undefined for undefined input", () => {
      const result = transformObjectId(undefined);

      expect(result).toBeUndefined();
    });

    it("should return undefined for null input", () => {
      const result = transformObjectId(null);

      expect(result).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      const result = transformObjectId("");

      expect(result).toBeUndefined();
    });

    it("should return undefined for string with only spaces", () => {
      const result = transformObjectId("   ");

      expect(result).toBeUndefined();
    });

    it("should return undefined for string shorter than 24 characters", () => {
      const result = transformObjectId("12345678901234567890123");

      expect(result).toBeUndefined();
    });

    it("should return undefined for string longer than 24 characters", () => {
      const result = transformObjectId("1234567890123456789012345");

      expect(result).toBeUndefined();
    });

    it("should return undefined for invalid hex string", () => {
      const result = transformObjectId("invalid-hex-string-123");

      expect(result).toBeUndefined();
    });

    it("should return undefined for number input", () => {
      const result = transformObjectId(123 as unknown as string);

      expect(result).toBeUndefined();
    });

    it("should return undefined for boolean input", () => {
      const result = transformObjectId(true as unknown as string);

      expect(result).toBeUndefined();
    });

    it("should return undefined for object input", () => {
      const result = transformObjectId({} as unknown as string);

      expect(result).toBeUndefined();
    });

    it("should return undefined for array input", () => {
      const result = transformObjectId([] as unknown as string);

      expect(result).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should trim whitespace before validation", () => {
      const validId = "507f1f77bcf86cd799439011";
      const result = transformObjectId(`  ${validId}  `);

      expect(result).toBeInstanceOf(Types.ObjectId);
      expect(result?.toString()).toBe(validId);
    });

    it("should return undefined for string with invalid characters after trimming", () => {
      const result = transformObjectId("   invalid-id-here   ");

      expect(result).toBeUndefined();
    });

    it("should handle string that becomes invalid after trimming", () => {
      const result = transformObjectId("  123  ");

      expect(result).toBeUndefined();
    });
  });
});
