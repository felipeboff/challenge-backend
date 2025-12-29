import type { NextFunction, Request, Response } from "express";
import z from "zod";

import { AppError, StatusCodeError } from "../shared/app-error";

export const ErrorHandlerMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response<{ error: string }> => {
  void _next;
  void _req;

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof z.ZodError) {
    return res.status(StatusCodeError.BAD_REQUEST).json({
      error: error.issues.map((issue) => issue.message).join(", "),
    });
  }

  return res.status(StatusCodeError.INTERNAL_SERVER_ERROR).json({
    error: "Internal server error",
  });
};
