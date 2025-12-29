import { Response } from "express";

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
}

export class HttpResponse {
  public static ok<T>(response: Response<T>, data: T): Response<T> {
    return response.status(HttpStatusCode.OK).json(data);
  }

  public static created<T>(response: Response<T>, data: T): Response<T> {
    return response.status(HttpStatusCode.CREATED).json(data);
  }

  public static noContent<T>(response: Response<T>): Response<T> {
    return response.status(HttpStatusCode.NO_CONTENT).end();
  }
}
