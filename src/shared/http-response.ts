import { Response } from "express";

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
}

export class HttpResponse {
  public static ok(response: Response, data?: unknown): Response {
    return response.status(HttpStatusCode.OK).json(data);
  }

  public static created(response: Response, data?: unknown): Response {
    return response.status(HttpStatusCode.CREATED).json(data);
  }

  public static noContent(response: Response): Response {
    return response.status(HttpStatusCode.NO_CONTENT).end();
  }
}
