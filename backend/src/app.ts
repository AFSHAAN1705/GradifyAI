import path from "node:path";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import { apiRateLimit } from "./middleware/rate-limit.middleware";
import { apiRoutes } from "./routes";
import { logger } from "./utils/logger";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(apiRateLimit);

  // Serve uploaded files
  app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

  app.use(apiRoutes);
  logger.info("All API routes initialized", {
    routes: ["auth", "ai", "colleges", "cutoffs", "predict", "admin", "upload", "college-intelligence", "misc"],
  });
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
