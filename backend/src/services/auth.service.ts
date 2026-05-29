import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { UserModel } from "../models/user.model";
import { ADMIN_EMAIL } from "./admin-user.service";
import { AppError } from "../utils/app-error";
import type { loginSchema, signupSchema } from "../validators/auth.validator";
import type { z } from "zod";

type SignupInput = z.infer<typeof signupSchema>;
type LoginInput = z.infer<typeof loginSchema>;

function signToken(user: { _id: unknown; email: string; role: string }) {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(
    {
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    {
      subject: String(user._id),
      ...options
    }
  );
}

function sanitizeUser(user: { _id: unknown; name?: string | null; email: string; role: string; createdAt?: Date }) {
  return {
    id: String(user._id),
    name: user.name ?? null,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

export async function signup(input: SignupInput) {
  const existing = await UserModel.exists({ email: input.email });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409, "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: "STUDENT"
  });

  return {
    user: sanitizeUser(user),
    token: signToken(user)
  };
}

export async function login(input: LoginInput) {
  const user = await UserModel.findOne({ email: input.email }).select("+passwordHash");
  if (!user) {
    throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  // Only the predefined admin email can have ADMIN role
  if (user.role === "ADMIN" && user.email !== ADMIN_EMAIL) {
    user.role = "STUDENT";
    await user.save();
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: sanitizeUser(user),
    token: signToken(user)
  };
}
