import { login, signup } from "../services/auth.service";
import { env } from "../config/env";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import type { Response, Request } from "express";

type AuthResult = Awaited<ReturnType<typeof signup>>;

function setAuthCookie(res: Response, token: string) {
  res.cookie(env.JWT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function sendAuthSuccess(res: Response, result: AuthResult, statusCode = 200) {
  return res.status(statusCode).json({
    ok: true,
    data: result,
    token: result.token,
    user: result.user
  });
}

export const authHealthController = asyncHandler(async (_req: Request, res: Response) => {
  console.log("[Auth Health] GET /api/auth/health → status online");
  return sendSuccess(res, { status: "online" });
});

export const signupController = asyncHandler(async (req, res) => {
  console.log(`[Auth Signup] POST /api/auth/signup email=${req.body.email}`);
  const result = await signup(req.body);
  setAuthCookie(res, result.token);
  console.log(`[Auth Signup] OK user=${result.user.id} role=${result.user.role}`);
  return sendAuthSuccess(res, result, 201);
});

export const loginController = asyncHandler(async (req, res) => {
  console.log(`[Auth Login] POST /api/auth/login email=${req.body.email}`);
  const result = await login(req.body);
  setAuthCookie(res, result.token);
  console.log(`[Auth Login] OK user=${result.user.id} role=${result.user.role}`);
  return sendAuthSuccess(res, result);
});

export const meController = asyncHandler(async (req, res) => {
  console.log(`[Auth Me] GET /api/auth/me user=${req.user?.id || "none"}`);
  if (!req.user) {
    throw new AppError("Authentication token is required.", 401, "AUTH_REQUIRED");
  }

  const user = await UserModel.findById(req.user.id).select("_id name email role").lean();
  if (!user) {
    throw new AppError("The authenticated user no longer exists.", 401, "AUTH_INVALID");
  }

  console.log(`[Auth Me] OK user=${user._id} email=${user.email} role=${user.role}`);
  return sendSuccess(res, {
    id: user._id.toString(),
    name: user.name ?? null,
    email: user.email,
    role: user.role
  });
});

export const logoutController = asyncHandler(async (_req, res) => {
  console.log("[Auth Logout] POST /api/auth/logout");
  res.clearCookie(env.JWT_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production"
  });
  return sendSuccess(res, { loggedOut: true });
});
