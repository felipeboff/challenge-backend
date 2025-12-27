import { NextFunction, Request, Response } from "express";
import { AppError, StatusCodeError } from "../shared/app-error";
import z from "zod";

export const ErrorHandlerMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  if (error instanceof z.ZodError) {
    res.status(StatusCodeError.BAD_REQUEST).json({
      name: "ZodError",
      message: "Invalid data",
      statusCode: StatusCodeError.BAD_REQUEST,
      details: error.issues,
    });
    return;
  }

  res.status(StatusCodeError.INTERNAL_SERVER_ERROR).json({
    name: "AppError",
    message: "Internal server error",
    statusCode: StatusCodeError.INTERNAL_SERVER_ERROR,
  });
  console.error(error);
  return;
};
