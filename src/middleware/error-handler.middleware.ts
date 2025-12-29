import type { NextFunction, Request, Response } from "express";
import z from "zod";

import { AppError, StatusCodeError } from "../shared/app-error";
import { logger } from "../shared/logger";

export const ErrorHandlerMiddleware = (
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction
): Response<{ error: string }> => {
  void _next;

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

  logger.error("Unhandled error", {
    error,
    details: {
      path: request.path,
      method: request.method,
    },
  });

  const errorMessage =
    error instanceof Error ? error.message : "Internal server error";
  return response
    .status(StatusCodeError.INTERNAL_SERVER_ERROR)
    .json({ error: errorMessage });
};
