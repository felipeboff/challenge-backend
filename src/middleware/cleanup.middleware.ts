import type { NextFunction, Request, Response } from "express";

export const cleanupMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  void response;

  if (request.authContext) delete request.authContext;
  next();
};
