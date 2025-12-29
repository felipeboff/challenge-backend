import { Request, Response } from "express";

import { HttpResponse } from "../../shared/http-response";
import { LoginSchema, RegisterSchema } from "./auth.schema";
import type { AuthService } from "./auth.service";
import type { IAuthUser } from "./auth.type";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (
    req: Request,
    res: Response,
  ): Promise<Response<IAuthUser>> => {
    const data = RegisterSchema.parse(req.body);
    const result = await this.authService.registerUser(data);
    return HttpResponse.created(res, result);
  };

  public login = async (
    req: Request,
    res: Response,
  ): Promise<Response<IAuthUser>> => {
    const data = LoginSchema.parse(req.body);
    const result = await this.authService.loginUser(data);
    return HttpResponse.ok(res, result);
  };
}
