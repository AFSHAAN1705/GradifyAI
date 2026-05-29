import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

type Source = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      if (source === "query") {
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: false,
          configurable: true
        });
      } else {
        req[source] = parsed as never;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        console.error(`[Validate] ${req.method} ${req.path} failed:`, {
          issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message, code: i.code })),
          body: req.body,
        });
      }
      next(err);
    }
  };
}
