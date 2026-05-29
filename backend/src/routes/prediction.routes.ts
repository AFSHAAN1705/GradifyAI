import { Router } from "express";
import { predictController } from "../controllers/prediction.controller";
import { optionalAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { predictionRequestSchema } from "../validators/admissions.validator";

export const predictionRoutes = Router();

predictionRoutes.post("/", optionalAuth, validate(predictionRequestSchema), predictController);
