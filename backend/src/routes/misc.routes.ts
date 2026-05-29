import { Router } from "express";
import {
  createChatController,
  createReviewController,
  healthController,
  listCategoriesController,
  listChatsController,
  listDistrictsController,
  listPlacementsController,
  listReviewsController,
  listTrendsController
} from "../controllers/misc.controller";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { chatSchema, reviewSchema } from "../validators/admissions.validator";

export const miscRoutes = Router();

miscRoutes.get("/health", healthController);
miscRoutes.get("/placements", listPlacementsController);
miscRoutes.get("/trends", listTrendsController);
miscRoutes.get("/reviews", listReviewsController);
miscRoutes.post("/reviews", requireAuth, validate(reviewSchema), createReviewController);
miscRoutes.get("/api/categories", listCategoriesController);
miscRoutes.get("/api/districts", listDistrictsController);
miscRoutes.get("/ai-chats", optionalAuth, listChatsController);
miscRoutes.post("/ai-chats", optionalAuth, validate(chatSchema), createChatController);
