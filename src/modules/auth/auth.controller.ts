import { Request, Response } from "express";

import { HttpResponse } from "../../shared/http-response";
import { LoginSchema, RegisterSchema } from "./auth.schema";
import type { AuthService } from "./auth.service";
import type { IAuthUser } from "./auth.type";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (
    request: Request,
    response: Response
  ): Promise<Response<IAuthUser>> => {
    const body = RegisterSchema.parse(request.body);
    const data = await this.authService.registerUser(body);
    return HttpResponse.created(response, data);
  };

  public login = async (
    request: Request,
    response: Response
  ): Promise<Response<IAuthUser>> => {
    const body = LoginSchema.parse(request.body);
    const data = await this.authService.loginUser(body);
    return HttpResponse.ok(response, data);
  };
}
