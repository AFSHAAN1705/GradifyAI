import { Types } from "mongoose";
import { BranchModel } from "../models/branch.model";
import { CategoryModel } from "../models/category.model";
import { CollegeModel } from "../models/college.model";
import { CutoffModel } from "../models/cutoff.model";
import { ImportLogModel } from "../models/importLog.model";
import { PlacementModel } from "../models/placement.model";
import { PredictionModel } from "../models/prediction.model";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/app-error";

export interface DashboardStats {
  totalColleges: number;
  totalBranches: number;
  totalCutoffs: number;
  totalUsers: number;
  totalPredictions: number;
  totalPlacements: number;
  totalCategories: number;
  importsByStatus: Record<string, number>;
  recentImports: Array<{
    _id: string;
    fileName: string;
    year: number;
    round: number;
    status: string;
    importedRows: number;
    failedRows: number;
    createdAt: Date;
  }>;
  cutoffsByYear: Array<{ year: number; count: number }>;
  predictionsByCategory: Array<{ categoryCode: string; count: number }>;
  userGrowth: Array<{ month: string; count: number }>;
  topColleges: Array<{ _id: string; name: string; code: string; city: string; cutoffCount: number }>;
  topBranches: Array<{ _id: string; name: string; code: string; cutoffCount: number }>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalColleges,
    totalBranches,
    totalCutoffs,
    totalUsers,
    totalPredictions,
    totalPlacements,
    totalCategories
  ] = await Promise.all([
    CollegeModel.countDocuments(),
    BranchModel.countDocuments(),
    CutoffModel.countDocuments(),
    UserModel.countDocuments(),
    PredictionModel.countDocuments(),
    PlacementModel.countDocuments(),
    CategoryModel.countDocuments()
  ]);

  // Get imports by status
  const importsByStatusAgg = await ImportLogModel.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
  const importsByStatus: Record<string, number> = {};
  importsByStatusAgg.forEach((item) => {
    importsByStatus[item._id] = item.count;
  });

  // Recent imports
  const recentImportsRaw = await ImportLogModel.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select("_id fileName year round status importedRows failedRows createdAt")
    .lean();

  const recentImports = recentImportsRaw.map((item) => ({
    _id: item._id.toString(),
    fileName: item.fileName,
    year: item.year,
    round: item.round,
    status: item.status,
    importedRows: item.importedRows,
    failedRows: item.failedRows,
    createdAt: item.createdAt
  }));

  // Cutoffs by year
  const cutoffsByYear = await CutoffModel.aggregate([
    { $group: { _id: "$year", count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $limit: 5 },
    { $project: { year: "$_id", count: 1, _id: 0 } }
  ]);

  // Predictions by category
  const predictionsByCategory = await PredictionModel.aggregate([
    { $group: { _id: "$categoryCode", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { categoryCode: "$_id", count: 1, _id: 0 } }
  ]);

  // User growth (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const userGrowth = await UserModel.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        month: {
          $concat: [
            { $arrayElemAt: [
              ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
              { $subtract: [{ $month: "$createdAt" }, 1] }
            ]}
          ]
        },
        count: 1,
        _id: 0
      }
    }
  ]);

  // Top colleges by cutoff count
  const topColleges = await CutoffModel.aggregate([
    { $group: { _id: "$collegeId", cutoffCount: { $sum: 1 } } },
    { $sort: { cutoffCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "colleges",
        localField: "_id",
        foreignField: "_id",
        as: "college"
      }
    },
    { $unwind: "$college" },
    {
      $project: {
        _id: "$college._id",
        name: "$college.name",
        code: "$college.code",
        city: "$college.city",
        cutoffCount: 1
      }
    }
  ]);

  // Top branches by cutoff count
  const topBranches = await CutoffModel.aggregate([
    { $group: { _id: "$branchId", cutoffCount: { $sum: 1 } } },
    { $sort: { cutoffCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "branches",
        localField: "_id",
        foreignField: "_id",
        as: "branch"
      }
    },
    { $unwind: "$branch" },
    {
      $project: {
        _id: "$branch._id",
        name: "$branch.name",
        code: "$branch.code",
        cutoffCount: 1
      }
    }
  ]);

  return {
    totalColleges,
    totalBranches,
    totalCutoffs,
    totalUsers,
    totalPredictions,
    totalPlacements,
    totalCategories,
    importsByStatus,
    recentImports,
    cutoffsByYear,
    predictionsByCategory,
    userGrowth,
    topColleges,
    topBranches
  };
}

export async function getImportLogs(params: {
  page?: number;
  limit?: number;
  status?: string;
  year?: number;
  round?: number;
}) {
  const { page = 1, limit = 20, status, year, round } = params;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (year) query.year = year;
  if (round) query.round = round;

  const [data, total] = await Promise.all([
    ImportLogModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "name email")
      .lean(),
    ImportLogModel.countDocuments(query)
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: skip + limit < total,
    hasPrev: page > 1
  } as PaginatedResult<typeof data[0]>;
}

export async function getImportLogById(id: string) {
  const log = await ImportLogModel.findById(id)
    .populate("uploadedBy", "name email")
    .populate("collegesCreated", "name code city")
    .populate("branchesCreated", "name code")
    .populate("categoriesCreated", "name code group")
    .lean();

  if (!log) {
    throw new AppError("Import log not found.", 404, "NOT_FOUND");
  }

  return log;
}

export async function getColleges(params: {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  state?: string;
}) {
  const { page = 1, limit = 20, search, city, state } = params;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (search) {
    query.$text = { $search: search };
  }
  if (city) query.city = city;
  if (state) query.state = state;

  const [data, total] = await Promise.all([
    CollegeModel.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CollegeModel.countDocuments(query)
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: skip + limit < total,
    hasPrev: page > 1
  } as PaginatedResult<typeof data[0]>;
}

export async function getCollegeById(id: string) {
  const college = await CollegeModel.findById(id)
    .populate("branchIds", "name code")
    .lean();

  if (!college) {
    throw new AppError("College not found.", 404, "NOT_FOUND");
  }

  return college;
}

export async function createCollege(data: {
  code: string;
  name: string;
  city: string;
  state: string;
  website?: string;
  latitude?: number;
  longitude?: number;
}) {
  const existing = await CollegeModel.findOne({ code: data.code.toUpperCase() });
  if (existing) {
    throw new AppError("College with this code already exists.", 409, "COLLEGE_EXISTS");
  }

  const college = await CollegeModel.create({
    ...data,
    code: data.code.toUpperCase()
  });

  return college;
}

export async function updateCollege(id: string, data: Partial<{
  name: string;
  city: string;
  state: string;
  website: string;
  latitude: number;
  longitude: number;
}>) {
  const college = await CollegeModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).populate("branchIds", "name code").lean();

  if (!college) {
    throw new AppError("College not found.", 404, "NOT_FOUND");
  }

  return college;
}

export async function deleteCollege(id: string) {
  const college = await CollegeModel.findByIdAndDelete(id);

  if (!college) {
    throw new AppError("College not found.", 404, "NOT_FOUND");
  }

  // Also remove college references from cutoffs
  await CutoffModel.deleteMany({ collegeId: new Types.ObjectId(id) });

  return { deleted: true, id };
}

export async function getBranches(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { page = 1, limit = 20, search } = params;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (search) {
    query.$text = { $search: search };
  }

  const [data, total] = await Promise.all([
    BranchModel.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BranchModel.countDocuments(query)
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: skip + limit < total,
    hasPrev: page > 1
  } as PaginatedResult<typeof data[0]>;
}

export async function createBranch(data: {
  code: string;
  name: string;
  aliases?: string[];
}) {
  const existing = await BranchModel.findOne({ code: data.code.toUpperCase() });
  if (existing) {
    throw new AppError("Branch with this code already exists.", 409, "BRANCH_EXISTS");
  }

  const branch = await BranchModel.create({
    ...data,
    code: data.code.toUpperCase()
  });

  return branch;
}

export async function updateBranch(id: string, data: Partial<{
  name: string;
  aliases: string[];
}>) {
  const branch = await BranchModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();

  if (!branch) {
    throw new AppError("Branch not found.", 404, "NOT_FOUND");
  }

  return branch;
}

export async function deleteBranch(id: string) {
  const branch = await BranchModel.findByIdAndDelete(id);

  if (!branch) {
    throw new AppError("Branch not found.", 404, "NOT_FOUND");
  }

  // Remove branch from all colleges
  await CollegeModel.updateMany(
    {},
    { $pull: { branchIds: new Types.ObjectId(id) } }
  );

  return { deleted: true, id };
}

export async function getCategories(params: {
  page?: number;
  limit?: number;
  group?: string;
}) {
  const { page = 1, limit = 50, group } = params;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (group) query.group = group;

  const [data, total] = await Promise.all([
    CategoryModel.find(query)
      .sort({ group: 1, code: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CategoryModel.countDocuments(query)
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: skip + limit < total,
    hasPrev: page > 1
  } as PaginatedResult<typeof data[0]>;
}

export async function getCutoffs(params: {
  page?: number;
  limit?: number;
  collegeId?: string;
  branchId?: string;
  categoryCode?: string;
  year?: number;
  round?: number;
}) {
  const { page = 1, limit = 50, collegeId, branchId, categoryCode, year, round } = params;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (collegeId) query.collegeId = new Types.ObjectId(collegeId);
  if (branchId) query.branchId = new Types.ObjectId(branchId);
  if (categoryCode) query.categoryCode = categoryCode.toUpperCase();
  if (year) query.year = year;
  if (round) query.round = round;

  const [data, total] = await Promise.all([
    CutoffModel.find(query)
      .populate("collegeId", "name code city")
      .populate("branchId", "name code")
      .sort({ year: -1, round: -1, rankClose: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CutoffModel.countDocuments(query)
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: skip + limit < total,
    hasPrev: page > 1
  } as PaginatedResult<typeof data[0]>;
}

export async function updateCutoff(id: string, data: Partial<{
  rankClose: number;
  rankOpen: number;
  percentile: number;
}>) {
  const cutoff = await CutoffModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();

  if (!cutoff) {
    throw new AppError("Cutoff not found.", 404, "NOT_FOUND");
  }

  return cutoff;
}

export async function deleteCutoff(id: string) {
  const cutoff = await CutoffModel.findByIdAndDelete(id);

  if (!cutoff) {
    throw new AppError("Cutoff not found.", 404, "NOT_FOUND");
  }

  return { deleted: true, id };
}

export async function getUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) {
  const { page = 1, limit = 20, search, role } = params;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }
  if (role) query.role = role;

  const [data, total] = await Promise.all([
    UserModel.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(query)
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: skip + limit < total,
    hasPrev: page > 1
  } as PaginatedResult<typeof data[0]>;
}

export async function updateUserRole(id: string, role: "STUDENT" | "ADMIN") {
  const user = await UserModel.findByIdAndUpdate(
    id,
    { $set: { role } },
    { new: true, runValidators: true }
  ).select("-passwordHash").lean();

  if (!user) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }

  return user;
}

export async function deleteUser(id: string) {
  const user = await UserModel.findByIdAndDelete(id);

  if (!user) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }

  return { deleted: true, id };
}

export async function getPlacements(params: {
  page?: number;
  limit?: number;
  collegeId?: string;
  academicYear?: string;
}) {
  const { page = 1, limit = 20, collegeId, academicYear } = params;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (collegeId) query.collegeId = new Types.ObjectId(collegeId);
  if (academicYear) query.academicYear = academicYear;

  const [data, total] = await Promise.all([
    PlacementModel.find(query)
      .populate("collegeId", "name code city")
      .populate("branchId", "name code")
      .sort({ academicYear: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PlacementModel.countDocuments(query)
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: skip + limit < total,
    hasPrev: page > 1
  } as PaginatedResult<typeof data[0]>;
}

export async function createPlacement(data: {
  collegeId: string;
  branchId?: string;
  academicYear: string;
  medianPackageLpa?: number;
  averagePackageLpa?: number;
  highestPackageLpa?: number;
  placementRate?: number;
  recruiters?: string[];
}) {
  const placement = await PlacementModel.create(data);
  return placement;
}

export async function updatePlacement(id: string, data: Partial<{
  medianPackageLpa: number;
  averagePackageLpa: number;
  highestPackageLpa: number;
  placementRate: number;
  recruiters: string[];
}>) {
  const placement = await PlacementModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();

  if (!placement) {
    throw new AppError("Placement not found.", 404, "NOT_FOUND");
  }

  return placement;
}

export async function deletePlacement(id: string) {
  const placement = await PlacementModel.findByIdAndDelete(id);

  if (!placement) {
    throw new AppError("Placement not found.", 404, "NOT_FOUND");
  }

  return { deleted: true, id };
}

export async function getPredictions(params: {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
}) {
  const { page = 1, limit = 20, userId, status } = params;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (userId) query.userId = new Types.ObjectId(userId);
  if (status) query.status = status;

  const [data, total] = await Promise.all([
    PredictionModel.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PredictionModel.countDocuments(query)
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: skip + limit < total,
    hasPrev: page > 1
  } as PaginatedResult<typeof data[0]>;
}
