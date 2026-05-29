import { Router } from "express";
import { adminRoutes } from "./admin.routes";
import { authRoutes } from "./auth.routes";
import { aiRoutes } from "./ai.routes";
import { collegeRoutes } from "./college.routes";
import { collegeIntelligenceRoutes } from "./college-intelligence.routes";
import { cutoffRoutes } from "./cutoff.routes";
import { miscRoutes } from "./misc.routes";
import { predictionRoutes } from "./prediction.routes";
import { uploadRoutes } from "./upload.routes";

export const apiRoutes = Router();

apiRoutes.use("/", miscRoutes);
apiRoutes.use("/api/auth", authRoutes);
apiRoutes.use("/api/ai", aiRoutes);
apiRoutes.use("/api/admin", adminRoutes);
apiRoutes.use("/api/colleges", collegeRoutes);
apiRoutes.use("/api/college-intelligence", collegeIntelligenceRoutes);
apiRoutes.use("/api/cutoffs", cutoffRoutes);
apiRoutes.use("/api/predict", predictionRoutes);
apiRoutes.use("/api/upload", uploadRoutes);
