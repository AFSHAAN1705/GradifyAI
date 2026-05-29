import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { uploadSamFile } from "../middleware/upload.middleware";

export const adminRoutes = Router();

// All admin routes require authentication and admin role
adminRoutes.use(requireAuth, requireAdmin);

// Dashboard
adminRoutes.get("/dashboard/stats", adminController.getDashboardStatsController);

// Import Logs
adminRoutes.get("/import-logs", adminController.getImportLogsController);
adminRoutes.get("/import-logs/:id", adminController.getImportLogByIdController);

// PDF Upload (replaces the old upload endpoint with logging)
adminRoutes.post("/upload-pdf", uploadSamFile.single("file"), adminController.uploadPdfWithLogController);

// College Management
adminRoutes.get("/colleges", adminController.getCollegesController);
adminRoutes.get("/colleges/:id", adminController.getCollegeByIdController);
adminRoutes.post("/colleges", adminController.createCollegeController);
adminRoutes.put("/colleges/:id", adminController.updateCollegeController);
adminRoutes.delete("/colleges/:id", adminController.deleteCollegeController);

// Branch Management
adminRoutes.get("/branches", adminController.getBranchesController);
adminRoutes.post("/branches", adminController.createBranchController);
adminRoutes.put("/branches/:id", adminController.updateBranchController);
adminRoutes.delete("/branches/:id", adminController.deleteBranchController);

// Category Management
adminRoutes.get("/categories", adminController.getCategoriesController);

// Cutoff Management
adminRoutes.get("/cutoffs", adminController.getCutoffsController);
adminRoutes.put("/cutoffs/:id", adminController.updateCutoffController);
adminRoutes.delete("/cutoffs/:id", adminController.deleteCutoffController);

// User Management
adminRoutes.get("/users", adminController.getUsersController);
adminRoutes.put("/users/:id/role", adminController.updateUserRoleController);
adminRoutes.delete("/users/:id", adminController.deleteUserController);

// Placement Management
adminRoutes.get("/placements", adminController.getPlacementsController);
adminRoutes.post("/placements", adminController.createPlacementController);
adminRoutes.put("/placements/:id", adminController.updatePlacementController);
adminRoutes.delete("/placements/:id", adminController.deletePlacementController);

// Prediction Monitoring
adminRoutes.get("/predictions", adminController.getPredictionsController);

// File Management
adminRoutes.get("/files", adminController.listUploadedFilesController);
adminRoutes.delete("/files/:filename", adminController.deleteUploadedFileController);