import type { NextFunction, Request, Response } from "express";
import z from "zod";

import { AppError, StatusCodeError } from "../shared/app-error";
import { logger } from "../shared/logger";

export const ErrorHandlerMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): Response<{ error: string }> => {
  void _next;

  if (error instanceof AppError) {
    logger.warn("Application error", {
      details: {
        requestId: req.requestId,
        statusCode: error.statusCode,
        message: error.message,
        path: req.path,
        method: req.method,
        details: error.details,
      },
    });
    return res.status(error.statusCode).json({
      requestId: req.requestId,
      error: error.message,
    });
  }

  if (error instanceof z.ZodError) {
    logger.warn("Validation error", {
      error,
      details: {
        requestId: req.requestId,
        statusCode: StatusCodeError.BAD_REQUEST,
        path: req.path,
        method: req.method,
      },
    });
    return res.status(StatusCodeError.BAD_REQUEST).json({
      requestId: req.requestId,
      error: error.issues.map((issue) => issue.message).join(", "),
    });
  }

  logger.error("Unhandled error", {
    error,
    details: {
      requestId: req.requestId,
      path: req.path,
      method: req.method,
    },
  });

  const errorMessage =
    error instanceof Error ? error.message : "Internal server error";
  return res
    .status(StatusCodeError.INTERNAL_SERVER_ERROR)
    .json({ requestId: req.requestId, error: errorMessage });
};
