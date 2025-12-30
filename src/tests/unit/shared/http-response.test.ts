import type { Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpStatusCode, HttpResponse } from "../../../shared/http-response";

describe("HttpResponse - Unit Tests", () => {
  let mockResponse: Response;

  beforeEach(() => {
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
    } as unknown as Response;
  });

  describe("ok", () => {
    it("should return response with 200 status and data", () => {
      const data = { id: "123", name: "Test" };

      const result = HttpResponse.ok(mockResponse, data);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(data);
      expect(result).toBe(mockResponse);
    });

    it("should work with different data types", () => {
      const stringData = "test string";
      HttpResponse.ok(mockResponse, stringData);

      expect(mockResponse.json).toHaveBeenCalledWith(stringData);
    });

    it("should work with array data", () => {
      const arrayData = [{ id: "1" }, { id: "2" }];
      HttpResponse.ok(mockResponse, arrayData);

      expect(mockResponse.json).toHaveBeenCalledWith(arrayData);
    });

    it("should work with null data", () => {
      HttpResponse.ok(mockResponse, null);

      expect(mockResponse.json).toHaveBeenCalledWith(null);
    });
  });

  describe("created", () => {
    it("should return response with 201 status and data", () => {
      const data = { id: "123", name: "Created Resource" };

      const result = HttpResponse.created(mockResponse, data);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatusCode.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith(data);
      expect(result).toBe(mockResponse);
    });

    it("should work with different data types", () => {
      const numberData = 42;
      HttpResponse.created(mockResponse, numberData);

      expect(mockResponse.json).toHaveBeenCalledWith(numberData);
    });
  });

  describe("noContent", () => {
    it("should return response with 204 status and end", () => {
      const result = HttpResponse.noContent(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatusCode.NO_CONTENT
      );
      expect(mockResponse.end).toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });
  });
});
