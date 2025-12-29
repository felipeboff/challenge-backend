import type { NextFunction, Request, Response } from "express";

export const cleanupMiddleware = (
  req: Request,
  _: Response,
  next: NextFunction
): void => {
  if (req.requestId) delete req.requestId;
  if (req.authContext) delete req.authContext;
  next();
};
