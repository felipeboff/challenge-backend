import { InternalServerError, UnauthorizedError } from "../../shared/app-error";
import { JwtService } from "../../shared/jwt-service";
import { PasswordHash } from "../../shared/password-hash";
import { RegisterInput, LoginInput } from "./auth.schema";
import { UserService } from "../users/user.service";
import { IUserRepository, IUserSafe, IUser } from "../users/user.type";

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userService: UserService
  ) {}

  public async registerUser(
    user: RegisterInput
  ): Promise<{ token: string; user: IUserSafe }> {
    const userCreated = await this.userService.createUser(user);

    const token = JwtService.sign({ userId: userCreated._id.toString() });
    if (!token) {
      throw new InternalServerError("Failed to generate token");
    }

    return { token, user: userCreated };
  }

  public async loginUser(
    user: LoginInput
  ): Promise<{ token: string; user: Omit<IUser, "password"> }> {
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
  }
}
