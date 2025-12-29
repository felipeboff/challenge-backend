import request from "supertest";

import app from "../../../app";
import { RegisterInput } from "../../../modules/auth/auth.schema";
import { createMockUserInput } from "../../mocks/user.mock";

export async function createAuthenticatedUser(
  userData?: Partial<RegisterInput>
): Promise<{ token: string; userId: string; email: string }> {
  const user = createMockUserInput(userData);

  const response = await request(app)
    .post("/api/auth/register")
    .send(user)
    .expect(201);

  return {
    token: response.body.token,
    userId: response.body.user._id,
    email: response.body.user.email,
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ token: string; userId: string }> {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);

  return {
    token: response.body.token,
    userId: response.body.user._id,
  };
}
