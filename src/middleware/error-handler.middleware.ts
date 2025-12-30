import type { NextFunction, Request, Response } from "express";
import { MongooseError } from "mongoose";
import z from "zod";

import { AppError, StatusCodeError } from "../shared/app-error";
import logger from "../shared/logger";

export class ErrorHandlerMiddleware {
  public handle = (
    error: unknown,
    request: Request,
    response: Response,
    next: NextFunction
  ): Response<{ error: string }> => {
    void next;

    if (error instanceof AppError) {
      logger.warn("Application error", {
        details: {
          statusCode: error.statusCode,
          message: error.message,
          path: request.path,
          method: request.method,
          ...(error.details && { details: error.details }),
        },
      });
      return response.status(error.statusCode).json({
        error: error.message,
      });
    }

    if (error instanceof z.ZodError) {
      logger.warn("Validation error", {
        error,
        details: {
          statusCode: StatusCodeError.BAD_REQUEST,
          path: request.path,
          method: request.method,
          issues: error.issues,
        },
      });
      return response.status(StatusCodeError.BAD_REQUEST).json({
        issues: error.issues,
      });
    }

    if (error instanceof Error) {
      const mongooseError = error as MongooseError;
      if (mongooseError.name === "MongoServerError") {
        logger.error("Mongoose error", {
          error,
          details: {
            stack: error.stack,
            path: request.path,
            method: request.method,
          },
        });
        return response.status(StatusCodeError.SERVICE_UNAVAILABLE).json({
          error: "Service unavailable",
        });
      }
      logger.error("Error not handled", {
        error,
        details: {
          path: request.path,
          method: request.method,
        },
      });

      return response
        .status(StatusCodeError.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }

    logger.error("Unknown error", {
      error,
      details: {
        path: request.path,
        method: request.method,
      },
    });

    return response
      .status(StatusCodeError.INTERNAL_SERVER_ERROR)
      .json({ error: "Unknown error" });
  };
}

export default new ErrorHandlerMiddleware().handle;
