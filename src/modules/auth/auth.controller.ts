import { Request, Response } from "express";
import { LoginSchema, RegisterSchema } from "./auth.schema";
import { BadRequestError } from "../../shared/app-error";
import { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public async register(req: Request, res: Response) {
    const validation = RegisterSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError("Invalid data", validation.error._zod);
    }

    const result = await this.authService.registerUser(validation.data);
    res.status(201).json(result);
  }

  public async login(req: Request, res: Response) {
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError("Invalid data", validation.error._zod);
    }

    const result = await this.authService.loginUser(validation.data);
    res.status(200).json(result);
  }
}
