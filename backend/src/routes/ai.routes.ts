import { Router, type Request, type Response } from "express";
import { compareController, counsellingController } from "../controllers/ai.controller";
import {
  chatController,
  getHistoryController,
  listConversationsController,
  deleteConversationController,
  strategyController,
  samHealthController,
  listKnowledgeController,
  createKnowledgeController,
  updateKnowledgeController,
  deleteKnowledgeController,
} from "../controllers/chat.controller";
import {
  samUploadFileController,
  samUploadImageController,
  samUploadVideoController,
} from "../controllers/sam-upload.controller";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { uploadSamFile } from "../middleware/upload.middleware";
import { aiCounsellingSchema, comparisonSchema, chatSchema, strategySchema, knowledgeSchema } from "../validators/ai.validator";

function guard(handler: unknown, name: string): (req: Request, res: Response) => void | Promise<void> {
  if (typeof handler !== "function") {
    console.error(`[AI Routes] FATAL: "${name}" is undefined or not a function. Route will return 500.`);
    return (_req: Request, res: Response) => {
      res.status(500).json({ ok: false, error: { code: "HANDLER_MISSING", message: `Handler "${name}" is not available.` } });
    };
  }
  return handler as (req: Request, res: Response) => void | Promise<void>;
}

const controllers = {
  counsellingController,
  compareController,
  chatController,
  getHistoryController,
  listConversationsController,
  deleteConversationController,
  strategyController,
  samHealthController,
  samUploadFileController,
  samUploadImageController,
  samUploadVideoController,
  listKnowledgeController,
  createKnowledgeController,
  updateKnowledgeController,
  deleteKnowledgeController,
};

const missing = Object.entries(controllers).filter(([, v]) => typeof v !== "function").map(([k]) => k);
if (missing.length > 0) {
  console.error(`[AI Routes] FATAL: Missing ${missing.length} controller(s): ${missing.join(", ")}`);
} else {
  console.log("[AI Routes] All controllers verified as functions.");
}

export const aiRoutes = Router();

// Diagnostics / health
aiRoutes.get("/health", guard(samHealthController, "samHealthController"));

// Existing endpoints
aiRoutes.post("/counsel", optionalAuth, validate(aiCounsellingSchema), guard(counsellingController, "counsellingController"));
aiRoutes.post("/compare", optionalAuth, validate(comparisonSchema), guard(compareController, "compareController"));

// SAM chatbot endpoints
aiRoutes.post("/chat", optionalAuth, validate(chatSchema), guard(chatController, "chatController"));
aiRoutes.get("/chat/:id", optionalAuth, guard(getHistoryController, "getHistoryController"));
aiRoutes.get("/conversations", optionalAuth, guard(listConversationsController, "listConversationsController"));
aiRoutes.delete("/chat/:id", optionalAuth, guard(deleteConversationController, "deleteConversationController"));

// Strategy generator
aiRoutes.post("/strategy", optionalAuth, validate(strategySchema), guard(strategyController, "strategyController"));

// SAM file upload endpoints
aiRoutes.post("/upload/file", optionalAuth, uploadSamFile.single("file"), guard(samUploadFileController, "samUploadFileController"));
aiRoutes.post("/upload/image", optionalAuth, uploadSamFile.single("image"), guard(samUploadImageController, "samUploadImageController"));
aiRoutes.post("/upload/video", optionalAuth, uploadSamFile.single("video"), guard(samUploadVideoController, "samUploadVideoController"));

// Knowledge base (admin)
aiRoutes.get("/knowledge", optionalAuth, guard(listKnowledgeController, "listKnowledgeController"));
aiRoutes.post("/knowledge", requireAuth, validate(knowledgeSchema), guard(createKnowledgeController, "createKnowledgeController"));
aiRoutes.put("/knowledge/:id", requireAuth, guard(updateKnowledgeController, "updateKnowledgeController"));
aiRoutes.delete("/knowledge/:id", requireAuth, guard(deleteKnowledgeController, "deleteKnowledgeController"));
