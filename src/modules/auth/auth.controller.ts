import { Request, Response } from "express";
import { LoginSchema, RegisterSchema } from "./auth.schema";
import { AuthService } from "./auth.service";
import { HttpResponse } from "../../shared/http-response";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public async register(req: Request, res: Response) {
    const data = RegisterSchema.parse(req.body);
    const result = await this.authService.registerUser(data);
    return HttpResponse.created(res, result);
  }

  public async login(req: Request, res: Response) {
    const data = LoginSchema.parse(req.body);
    const result = await this.authService.loginUser(data);
    return HttpResponse.ok(res, result);
  }
}
