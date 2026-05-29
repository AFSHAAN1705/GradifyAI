import type { FilterQuery, SortOrder } from "mongoose";
import { BranchModel } from "../models/branch.model";
import { CutoffModel, type CutoffDocument } from "../models/cutoff.model";
import type { CutoffSearchInput } from "../validators/admissions.validator";

export async function searchCutoffs(input: CutoffSearchInput) {
  const filter: FilterQuery<CutoffDocument> = {};

  if (input.collegeId) filter.collegeId = input.collegeId;
  if (input.categoryCode) filter.categoryCode = input.categoryCode;
  if (input.year) filter.year = input.year;
  if (input.round) filter.round = input.round;
  if (input.minRank || input.maxRank) {
    filter.rankClose = {
      ...(input.minRank ? { $gte: input.minRank } : {}),
      ...(input.maxRank ? { $lte: input.maxRank } : {})
    };
  }

  if (input.branchCode) {
    const branch = await BranchModel.findOne({ code: input.branchCode }).select("_id").lean();
    filter.branchId = branch?._id ?? "__missing_branch__";
  }

  const sort: Record<string, SortOrder> = {
    [input.sortBy]: input.sortDirection === "asc" ? 1 : -1
  };
  const skip = (input.page - 1) * input.pageSize;

  const [items, total] = await Promise.all([
    CutoffModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(input.pageSize)
      .populate("collegeId", "code name city state")
      .populate("branchId", "code name")
      .lean(),
    CutoffModel.countDocuments(filter)
  ]);

  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize
  };
}
