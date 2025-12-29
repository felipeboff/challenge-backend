import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

import { logger } from "../shared/logger";

export const RequestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = new Types.ObjectId().toString();
  const startTime = Date.now();
  const { method, path, ip } = req;
  req.requestId = requestId;

  logger.debug("Request started", {
    details: {
      requestId,
      method,
      path,
      ip,
      userAgent: req.get("user-agent"),
    },
  });

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    const logData = {
      requestId,
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent: req.get("user-agent"),
    };

    if (statusCode >= 500) {
      logger.error("Request completed with server error", {
        details: logData,
      });
    } else if (statusCode >= 400) {
      logger.warn("Request completed with client error", {
        details: logData,
      });
    } else {
      logger.info("Request completed", {
        details: logData,
      });
    }
  });

  next();
};
