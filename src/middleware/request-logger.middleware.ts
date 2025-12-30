import type { NextFunction, Request, Response } from "express";

import logger from "../shared/logger";

export const RequestLoggerMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const { method, path, ip } = request;

  logger.debug("Request started", {
    details: {
      method,
      path,
      ip,
      userAgent: request.get("user-agent"),
    },
  });

  response.on("finish", () => {
    const duration = Date.now() - startTime;
    const { statusCode } = response;

    const logData = {
      method,
      path,
      ip,
      userAgent: request.get("user-agent"),
      statusCode,
      duration: `${duration}ms`,
    };

    logger.info("Request completed", {
      details: logData,
    });
  });

  next();
};
