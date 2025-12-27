export enum StatusCodeError {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}

export type ErrorDetails = Record<string, unknown> | undefined;

export class AppError extends Error {
  public readonly statusCode: StatusCodeError;
  public readonly details?: ErrorDetails;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: StatusCodeError = StatusCodeError.INTERNAL_SERVER_ERROR,
    details?: ErrorDetails,
    isOperational = true
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): {
    name: string;
    message: string;
    statusCode: number;
    details?: ErrorDetails;
  } {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    };
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Requisição inválida", details?: ErrorDetails) {
    super(message, StatusCodeError.BAD_REQUEST, details);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado", details?: ErrorDetails) {
    super(message, StatusCodeError.UNAUTHORIZED, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado", details?: ErrorDetails) {
    super(message, StatusCodeError.FORBIDDEN, details);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado", details?: ErrorDetails) {
    super(message, StatusCodeError.NOT_FOUND, details);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito na requisição", details?: ErrorDetails) {
    super(message, StatusCodeError.CONFLICT, details);
    this.name = "ConflictError";
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = "Entidade não processável", details?: ErrorDetails) {
    super(message, StatusCodeError.UNPROCESSABLE_ENTITY, details);
    this.name = "UnprocessableEntityError";
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Erro interno do servidor", details?: ErrorDetails) {
    super(message, StatusCodeError.INTERNAL_SERVER_ERROR, details, false);
    this.name = "InternalServerError";
  }
}
