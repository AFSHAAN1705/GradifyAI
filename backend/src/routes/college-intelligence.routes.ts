import { Router } from "express";
import {
  getEnhancedCollegeDetailController,
  getDistrictCollegesController,
  compareCollegesController,
  verifyPlacementController,
} from "../controllers/college-intelligence.controller";

export const collegeIntelligenceRoutes = Router();

collegeIntelligenceRoutes.get("/:id/enhanced", getEnhancedCollegeDetailController);
collegeIntelligenceRoutes.get("/district/:district", getDistrictCollegesController);
collegeIntelligenceRoutes.get("/compare", compareCollegesController);
collegeIntelligenceRoutes.get("/:id/verify-placement", verifyPlacementController);
