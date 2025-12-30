import { InternalServerError, UnauthorizedError } from "../../shared/app-error";
import type { JwtService } from "../../shared/jwt-service";
import type { PasswordHash } from "../../shared/password-hash";
import type { UserRepository } from "../users/user.repository";
import type { UserService } from "../users/user.service";
import type { LoginInput, RegisterInput } from "./auth.schema";
import type { IAuthUser } from "./auth.type";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly passwordHash: PasswordHash
  ) {}

  public registerUser = async (user: RegisterInput): Promise<IAuthUser> => {
    const userCreated = await this.userService.createUser(user);

    const token = this.jwtService.sign({ userId: userCreated.id.toString() });
    if (!token) {
      throw new InternalServerError("Failed to generate token", {
        origin: "AuthService.registerUser",
      });
    }

    return { token, user: userCreated };
  };

  public loginUser = async (user: LoginInput): Promise<IAuthUser> => {
    const userFound = await this.userRepository.findByEmail(user.email);
    if (!userFound) {
      throw new UnauthorizedError("Invalid email or password", {
        origin: "AuthService.loginUser",
        message: "User not found",
      });
    }

    const { password, ...safeUser } = userFound;

    const isPasswordValid = await this.passwordHash.compare(
      user.password,
      password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password", {
        origin: "AuthService.loginUser",
        message: "Invalid password",
      });
    }

    const token = this.jwtService.sign({ userId: safeUser.id.toString() });
    if (!token) {
      throw new InternalServerError("Failed to generate token", {
        origin: "AuthService.loginUser",
      });
    }

    return { token, user: safeUser };
  };
}
