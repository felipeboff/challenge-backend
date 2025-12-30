import { describe, expect, it } from "vitest";

import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
  StatusCodeError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "../../../shared/app-error";

describe("AppError - Unit Tests", () => {
  describe("AppError", () => {
    it("should create an AppError with default status code", () => {
      const error = new AppError("Test error");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("AppError");
      expect(error.statusCode).toBe(StatusCodeError.INTERNAL_SERVER_ERROR);
      expect(error.details).toBeUndefined();
    });

    it("should create an AppError with custom status code", () => {
      const error = new AppError("Test error", StatusCodeError.BAD_REQUEST);

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(StatusCodeError.BAD_REQUEST);
    });

    it("should create an AppError with details", () => {
      const details = { field: "email", reason: "invalid format" };
      const error = new AppError(
        "Test error",
        StatusCodeError.BAD_REQUEST,
        details
      );

      expect(error.details).toEqual(details);
    });

    it("should convert to JSON correctly", () => {
      const details = { field: "email" };
      const error = new AppError(
        "Test error",
        StatusCodeError.BAD_REQUEST,
        details
      );

      const json = error.toJSON();

      expect(json).toEqual({
        name: "AppError",
        message: "Test error",
        statusCode: StatusCodeError.BAD_REQUEST,
        details,
      });
    });

    it("should convert to JSON without details when details are undefined", () => {
      const error = new AppError("Test error");

      const json = error.toJSON();

      expect(json).toEqual({
        name: "AppError",
        message: "Test error",
        statusCode: StatusCodeError.INTERNAL_SERVER_ERROR,
      });
      expect(json.details).toBeUndefined();
    });
  });

  describe("BadRequestError", () => {
    it("should create a BadRequestError with default message", () => {
      const error = new BadRequestError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe("BadRequestError");
      expect(error.message).toBe("Bad Request");
      expect(error.statusCode).toBe(StatusCodeError.BAD_REQUEST);
    });

    it("should create a BadRequestError with custom message", () => {
      const error = new BadRequestError("Custom bad request");

      expect(error.message).toBe("Custom bad request");
      expect(error.statusCode).toBe(StatusCodeError.BAD_REQUEST);
    });

    it("should create a BadRequestError with details", () => {
      const details = { field: "email" };
      const error = new BadRequestError("Custom message", details);

      expect(error.details).toEqual(details);
    });
  });

  describe("UnauthorizedError", () => {
    it("should create an UnauthorizedError with default message", () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe("UnauthorizedError");
      expect(error.message).toBe("Unauthorized");
      expect(error.statusCode).toBe(StatusCodeError.UNAUTHORIZED);
    });

    it("should create an UnauthorizedError with custom message", () => {
      const error = new UnauthorizedError("Custom unauthorized");

      expect(error.message).toBe("Custom unauthorized");
      expect(error.statusCode).toBe(StatusCodeError.UNAUTHORIZED);
    });
  });

  describe("ForbiddenError", () => {
    it("should create a ForbiddenError with default message", () => {
      const error = new ForbiddenError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe("ForbiddenError");
      expect(error.message).toBe("Forbidden");
      expect(error.statusCode).toBe(StatusCodeError.FORBIDDEN);
    });

    it("should create a ForbiddenError with custom message", () => {
      const error = new ForbiddenError("Custom forbidden");

      expect(error.message).toBe("Custom forbidden");
      expect(error.statusCode).toBe(StatusCodeError.FORBIDDEN);
    });
  });

  describe("NotFoundError", () => {
    it("should create a NotFoundError with default message", () => {
      const error = new NotFoundError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe("NotFoundError");
      expect(error.message).toBe("Not Found");
      expect(error.statusCode).toBe(StatusCodeError.NOT_FOUND);
    });

    it("should create a NotFoundError with custom message", () => {
      const error = new NotFoundError("Custom not found");

      expect(error.message).toBe("Custom not found");
      expect(error.statusCode).toBe(StatusCodeError.NOT_FOUND);
    });
  });

  describe("ConflictError", () => {
    it("should create a ConflictError with default message", () => {
      const error = new ConflictError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe("ConflictError");
      expect(error.message).toBe("Conflict");
      expect(error.statusCode).toBe(StatusCodeError.CONFLICT);
    });

    it("should create a ConflictError with custom message", () => {
      const error = new ConflictError("Custom conflict");

      expect(error.message).toBe("Custom conflict");
      expect(error.statusCode).toBe(StatusCodeError.CONFLICT);
    });
  });

  describe("UnprocessableEntityError", () => {
    it("should create an UnprocessableEntityError with default message", () => {
      const error = new UnprocessableEntityError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe("UnprocessableEntityError");
      expect(error.message).toBe("Unprocessable Entity");
      expect(error.statusCode).toBe(StatusCodeError.UNPROCESSABLE_ENTITY);
    });

    it("should create an UnprocessableEntityError with custom message", () => {
      const error = new UnprocessableEntityError("Custom unprocessable");

      expect(error.message).toBe("Custom unprocessable");
      expect(error.statusCode).toBe(StatusCodeError.UNPROCESSABLE_ENTITY);
    });
  });

  describe("InternalServerError", () => {
    it("should create an InternalServerError with default message", () => {
      const error = new InternalServerError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe("InternalServerError");
      expect(error.message).toBe("Internal Server Error");
      expect(error.statusCode).toBe(StatusCodeError.INTERNAL_SERVER_ERROR);
    });

    it("should create an InternalServerError with custom message", () => {
      const error = new InternalServerError("Custom internal error");

      expect(error.message).toBe("Custom internal error");
      expect(error.statusCode).toBe(StatusCodeError.INTERNAL_SERVER_ERROR);
    });
  });

  describe("ServiceUnavailableError", () => {
    it("should create a ServiceUnavailableError with default message", () => {
      const error = new ServiceUnavailableError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe("ServiceUnavailableError");
      expect(error.message).toBe("Service Unavailable");
      expect(error.statusCode).toBe(StatusCodeError.SERVICE_UNAVAILABLE);
    });

    it("should create a ServiceUnavailableError with custom message", () => {
      const error = new ServiceUnavailableError("Custom unavailable");

      expect(error.message).toBe("Custom unavailable");
      expect(error.statusCode).toBe(StatusCodeError.SERVICE_UNAVAILABLE);
    });
  });
});
