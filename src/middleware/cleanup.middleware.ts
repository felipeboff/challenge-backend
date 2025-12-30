import type { NextFunction, Request, Response } from "express";

export class CleanupMiddleware {
  public handle = (
    request: Request,
    response: Response,
    next: NextFunction
  ): void => {
    void response;

    if (request.authContext) delete request.authContext;
    next();
  };
}

export default new CleanupMiddleware().handle;
