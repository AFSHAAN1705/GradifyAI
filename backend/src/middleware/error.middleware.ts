import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { isAppError } from "../utils/app-error";
import { logger } from "../utils/logger";

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  const requestInfo = `${req.method} ${req.originalUrl || req.url}`;

  if (error instanceof ZodError) {
    console.error(`[Error] ${requestInfo} 422 VALIDATION_ERROR`, error.flatten());
    res.status(422).json({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "The request payload is invalid.",
        details: error.flatten()
      }
    });
    return;
  }

  if (isAppError(error)) {
    const logLevel = error.statusCode >= 500 ? "error" : "warn";
    console[logLevel](`[Error] ${requestInfo} ${error.statusCode} ${error.code}: ${error.message}`);
    res.status(error.statusCode).json({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      }
    });
    return;
  }

  console.error(`[Error] ${requestInfo} 500 INTERNAL_ERROR:`, error instanceof Error ? error.message : String(error));
  logger.error("Unhandled request error", {
    error: error instanceof Error ? error.message : String(error),
    url: requestInfo
  });

  res.status(500).json({
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred."
    }
  });
};
