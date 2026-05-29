import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../config/env";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/app-error";
import { asyncHandler } from "../utils/async-handler";

type TokenPayload = {
  sub: string;
  email: string;
  role: "STUDENT" | "ADMIN";
};

function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    throw new AppError("Authentication token is invalid or expired.", 401, "AUTH_INVALID");
  }
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const cookieToken = req.cookies?.[env.JWT_COOKIE_NAME] as string | undefined;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : cookieToken ?? null;

  if (!token || token === "null" || token === "undefined") {
    throw new AppError("Authentication token is required.", 401, "AUTH_REQUIRED");
  }

  const payload = verifyToken(token);
  const user = await UserModel.findById(payload.sub).select("_id email role").lean();
  if (!user) {
    throw new AppError("The authenticated user no longer exists.", 401, "AUTH_INVALID");
  }

  req.user = {
    id: user._id.toString(),
    _id: new Types.ObjectId(user._id.toString()),
    email: user.email,
    role: user.role,
    name: (user as unknown as { name?: string }).name ?? null
  };
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const cookieToken = req.cookies?.[env.JWT_COOKIE_NAME] as string | undefined;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : cookieToken ?? null;
  if (!token || token === "null" || token === "undefined") {
    next();
    return;
  }

  const payload = verifyToken(token);
  const user = await UserModel.findById(payload.sub).select("_id name email role").lean();
  if (user) {
    req.user = {
      id: user._id.toString(),
      _id: new Types.ObjectId(user._id.toString()),
      email: user.email,
      role: user.role,
      name: (user as unknown as { name?: string }).name ?? null
    };
  }
  next();
});

export const requireAdmin = asyncHandler(async (req, _res, next) => {
  if (!req.user) {
    throw new AppError("Authentication token is required.", 401, "AUTH_REQUIRED");
  }

  if (req.user.role !== "ADMIN") {
    throw new AppError("Admin access is required.", 403, "ADMIN_REQUIRED");
  }

  next();
});
