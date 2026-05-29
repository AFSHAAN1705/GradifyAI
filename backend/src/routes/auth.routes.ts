import { Router } from "express";
import { loginController, logoutController, meController, signupController, authHealthController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { authRateLimit } from "../middleware/rate-limit.middleware";
import { validate } from "../middleware/validate";
import { loginSchema, signupSchema } from "../validators/auth.validator";

export const authRoutes = Router();

// Health check — no auth required
authRoutes.get("/health", authHealthController);

// Registration
authRoutes.post("/signup", authRateLimit, validate(signupSchema), signupController);
authRoutes.post("/register", authRateLimit, validate(signupSchema), signupController); // alias

// Login
authRoutes.post("/login", authRateLimit, validate(loginSchema), loginController);

// Current user
authRoutes.get("/me", requireAuth, meController);

// Logout
authRoutes.post("/logout", logoutController);

console.log("  Auth Route Registered: POST /api/auth/login");
console.log("  Auth Route Registered: POST /api/auth/signup");
console.log("  Auth Route Registered: POST /api/auth/register");
console.log("  Auth Route Registered: GET  /api/auth/me");
console.log("  Auth Route Registered: POST /api/auth/logout");
console.log("  Auth Route Registered: GET  /api/auth/health");
