import { InternalServerError, UnauthorizedError } from "../../shared/app-error";
import { JwtService } from "../../shared/jwt-service";
import { PasswordHash } from "../../shared/password-hash";
import type { UserRepository } from "../users/user.repository";
import type { UserService } from "../users/user.service";
import type { LoginInput, RegisterInput } from "./auth.schema";
import type { IAuthUser } from "./auth.type";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
  ) {}

  public registerUser = async (user: RegisterInput): Promise<IAuthUser> => {
    const userCreated = await this.userService.createUser(user);

    const token = JwtService.sign({ userId: userCreated._id.toString() });
    if (!token) {
      throw new InternalServerError("Failed to generate token");
    }

    return { token, user: userCreated };
  };

  public loginUser = async (user: LoginInput): Promise<IAuthUser> => {
    const userFound = await this.userRepository.findByEmail(user.email);
    if (!userFound) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const { password, ...safeUser } = userFound;

    const isPasswordValid = await PasswordHash.compare(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = JwtService.sign({ userId: safeUser._id.toString() });
    if (!token) {
      throw new InternalServerError("Failed to generate token");
    }

    return { token, user: safeUser };
  };
}
