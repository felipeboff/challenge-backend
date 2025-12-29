import "dotenv/config";

import pino from "pino";
import z from "zod";

import { AppError } from "./app-error";

interface ILogger {
  details?: Record<string, unknown>;
  error?: unknown;
}

const NODE_ENV = process.env.NODE_ENV;
const LOG_LEVEL = process.env.LOG_LEVEL;

if (!LOG_LEVEL || !NODE_ENV) {
  throw new Error("LOG_LEVEL and NODE_ENV are required");
}

const pinoLogger = pino({
  level: LOG_LEVEL,
  ...(NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  }),
});

class Logger {
  private logger: pino.Logger;

  constructor() {
    this.logger = pinoLogger;
  }

  public debug(message: string, props?: ILogger): void {
    if (props?.details) {
      return this.logger.debug(props.details, message);
    }
    return this.logger.debug(message);
  }

  public info(message: string, props?: ILogger): void {
    if (props?.details) {
      return this.logger.info(props.details, message);
    }
    return this.logger.info(message);
  }

  public warn(message: string, props?: ILogger): void {
    if (props?.details) {
      return this.logger.warn(props.details, message);
    }
    return this.logger.warn(message);
  }

  public error(message: string, props?: ILogger): void {
    let details: Record<string, unknown> = {};

    if (props?.details) {
      details = { ...details, ...props.details };
    }

    if (props?.error instanceof AppError) {
      details = { ...details, ...props.error.toJSON() };
    } else if (props?.error instanceof z.ZodError) {
      details = { ...details, issues: props.error.issues };
    } else if (props?.error instanceof Error) {
      details = { ...details, ...props.error };
    } else if (props?.error) {
      details = { ...details, error: props.error };
    }

    if (Object.keys(details).length === 0) {
      return this.logger.error(message);
    }

    return this.logger.error(details, message);
  }
}

export const logger = new Logger();
