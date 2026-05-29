import { Router } from "express";
import { uploadPdfController } from "../controllers/upload.controller";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";
import { uploadPdf } from "../middleware/upload.middleware";

export const uploadRoutes = Router();

uploadRoutes.post("/pdf", requireAuth, requireAdmin, uploadPdf.single("file"), uploadPdfController);
uploadRoutes.post("/", requireAuth, requireAdmin, uploadPdf.single("file"), uploadPdfController);
