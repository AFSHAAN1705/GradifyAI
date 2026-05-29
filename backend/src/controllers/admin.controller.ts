import fs from "node:fs/promises";
import path from "node:path";
import { ingestCutoffPdf } from "../services/pdf-ingestion.service";
import * as adminService from "../services/admin.service";
import { ImportLogModel } from "../models/importLog.model";
import { AppError } from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import type { Request, Response } from "express";

function getParam(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

// Dashboard
export const getDashboardStatsController = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  return sendSuccess(res, stats);
});

// Import Logs
export const getImportLogsController = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status, year, round } = req.query;
  const logs = await adminService.getImportLogs({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    status: status as string,
    year: year ? Number(year) : undefined,
    round: round ? Number(round) : undefined
  });
  return sendSuccess(res, logs);
});

export const getImportLogByIdController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const log = await adminService.getImportLogById(id);
  return sendSuccess(res, log);
});

// PDF Upload with logging
export const uploadPdfWithLogController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("A PDF file is required.", 400, "FILE_REQUIRED");
  }

  const startTime = Date.now();
  const year = req.body.year ? Number(req.body.year) : undefined;
  const round = req.body.round ? Number(req.body.round) : undefined;

  // Create initial import log
  const importLog = await ImportLogModel.create({
    fileName: req.file.filename,
    originalName: req.file.originalname,
    filePath: req.file.path,
    year: year || 2025,
    round: round || 1,
    roundLabel: `Round ${round || 1}`,
    status: "PROCESSING",
    fileSize: req.file.size,
    uploadedBy: req.user?._id
  });

  try {
    const result = await ingestCutoffPdf({
      filePath: req.file.path,
      originalName: req.file.originalname,
      year,
      round
    });

    const processingTime = Date.now() - startTime;

    // Update import log with results
    await ImportLogModel.findByIdAndUpdate(importLog._id, {
      $set: {
        status: "COMPLETED",
        totalRows: result.imported + (result.skipped || 0),
        importedRows: result.imported,
        skippedRows: result.skipped || 0,
        failedRows: result.failedRows?.length || 0,
        errors: result.failedRows || [],
        processingTimeMs: processingTime,
        metadata: {
          parsedRows: result.imported,
          originalSkipped: result.skipped
        }
      }
    });

    return sendSuccess(res, {
      ...result,
      importLogId: importLog._id,
      processingTimeMs: processingTime
    }, 201);
  } catch (error) {
    const processingTime = Date.now() - startTime;

    await ImportLogModel.findByIdAndUpdate(importLog._id, {
      $set: {
        status: "FAILED",
        processingTimeMs: processingTime,
        errors: [{
          line: "",
          reason: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date()
        }]
      }
    });

    throw error;
  }
});

// College Management
export const getCollegesController = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, city, state } = req.query;
  const colleges = await adminService.getColleges({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    search: search as string,
    city: city as string,
    state: state as string
  });
  return sendSuccess(res, colleges);
});

export const getCollegeByIdController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const college = await adminService.getCollegeById(id);
  return sendSuccess(res, college);
});

export const createCollegeController = asyncHandler(async (req: Request, res: Response) => {
  const { code, name, city, state, website, latitude, longitude } = req.body;
  const college = await adminService.createCollege({
    code,
    name,
    city,
    state,
    website,
    latitude,
    longitude
  });
  return sendSuccess(res, college, 201);
});

export const updateCollegeController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const { name, city, state, website, latitude, longitude } = req.body;
  const college = await adminService.updateCollege(id, {
    name,
    city,
    state,
    website,
    latitude,
    longitude
  });
  return sendSuccess(res, college);
});

export const deleteCollegeController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const result = await adminService.deleteCollege(id);
  return sendSuccess(res, result);
});

// Branch Management
export const getBranchesController = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search } = req.query;
  const branches = await adminService.getBranches({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    search: search as string
  });
  return sendSuccess(res, branches);
});

export const createBranchController = asyncHandler(async (req: Request, res: Response) => {
  const { code, name, aliases } = req.body;
  const branch = await adminService.createBranch({ code, name, aliases });
  return sendSuccess(res, branch, 201);
});

export const updateBranchController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const { name, aliases } = req.body;
  const branch = await adminService.updateBranch(id, { name, aliases });
  return sendSuccess(res, branch);
});

export const deleteBranchController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const result = await adminService.deleteBranch(id);
  return sendSuccess(res, result);
});

// Category Management
export const getCategoriesController = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, group } = req.query;
  const categories = await adminService.getCategories({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 50,
    group: group as string
  });
  return sendSuccess(res, categories);
});

// Cutoff Management
export const getCutoffsController = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, collegeId, branchId, categoryCode, year, round } = req.query;
  const cutoffs = await adminService.getCutoffs({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 50,
    collegeId: collegeId as string,
    branchId: branchId as string,
    categoryCode: categoryCode as string,
    year: year ? Number(year) : undefined,
    round: round ? Number(round) : undefined
  });
  return sendSuccess(res, cutoffs);
});

export const updateCutoffController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const { rankClose, rankOpen, percentile } = req.body;
  const cutoff = await adminService.updateCutoff(id, { rankClose, rankOpen, percentile });
  return sendSuccess(res, cutoff);
});

export const deleteCutoffController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const result = await adminService.deleteCutoff(id);
  return sendSuccess(res, result);
});

// User Management
export const getUsersController = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, role } = req.query;
  const users = await adminService.getUsers({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    search: search as string,
    role: role as string
  });
  return sendSuccess(res, users);
});

export const updateUserRoleController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const { role } = req.body;
  if (!["STUDENT", "ADMIN"].includes(role)) {
    throw new AppError("Invalid role. Must be STUDENT or ADMIN.", 400, "INVALID_ROLE");
  }
  const user = await adminService.updateUserRole(id, role);
  return sendSuccess(res, user);
});

export const deleteUserController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const result = await adminService.deleteUser(id);
  return sendSuccess(res, result);
});

// Placement Management
export const getPlacementsController = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, collegeId, academicYear } = req.query;
  const placements = await adminService.getPlacements({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    collegeId: collegeId as string,
    academicYear: academicYear as string
  });
  return sendSuccess(res, placements);
});

export const createPlacementController = asyncHandler(async (req: Request, res: Response) => {
  const {
    collegeId,
    branchId,
    academicYear,
    medianPackageLpa,
    averagePackageLpa,
    highestPackageLpa,
    placementRate,
    recruiters
  } = req.body;
  const placement = await adminService.createPlacement({
    collegeId,
    branchId,
    academicYear,
    medianPackageLpa,
    averagePackageLpa,
    highestPackageLpa,
    placementRate,
    recruiters
  });
  return sendSuccess(res, placement, 201);
});

export const updatePlacementController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const {
    medianPackageLpa,
    averagePackageLpa,
    highestPackageLpa,
    placementRate,
    recruiters
  } = req.body;
  const placement = await adminService.updatePlacement(id, {
    medianPackageLpa,
    averagePackageLpa,
    highestPackageLpa,
    placementRate,
    recruiters
  });
  return sendSuccess(res, placement);
});

export const deletePlacementController = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const result = await adminService.deletePlacement(id);
  return sendSuccess(res, result);
});

// Prediction Monitoring
export const getPredictionsController = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, userId, status } = req.query;
  const predictions = await adminService.getPredictions({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    userId: userId as string,
    status: status as string
  });
  return sendSuccess(res, predictions);
});

// File Management
export const listUploadedFilesController = asyncHandler(async (_req: Request, res: Response) => {
  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  
  try {
    const files = await fs.readdir(uploadDir);
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(uploadDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
    );

    return sendSuccess(res, {
      files: fileDetails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      total: fileDetails.length
    });
  } catch (error) {
    // If directory doesn't exist, return empty list
    return sendSuccess(res, { files: [], total: 0 });
  }
});

export const deleteUploadedFileController = asyncHandler(async (req: Request, res: Response) => {
  const filename = getParam(req, "filename");
  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  const filePath = path.join(uploadDir, filename);

  // Security check: ensure the path is within upload directory
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(uploadDir);
  
  if (!resolvedPath.startsWith(resolvedUploadDir)) {
    throw new AppError("Invalid file path.", 400, "INVALID_PATH");
  }

  try {
    await fs.unlink(filePath);
    return sendSuccess(res, { deleted: true, filename });
  } catch (error) {
    throw new AppError("File not found or could not be deleted.", 404, "FILE_NOT_FOUND");
  }
});
