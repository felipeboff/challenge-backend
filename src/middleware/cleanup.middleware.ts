import type { NextFunction, Request, Response } from "express";

export const cleanupMiddleware = (
  request: Request,
  _: Response,
  next: NextFunction
): void => {
  if (request.authContext) delete request.authContext;
  next();
};
