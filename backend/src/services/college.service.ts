import type { FilterQuery, SortOrder } from "mongoose";
import { Types } from "mongoose";
import { BranchModel } from "../models/branch.model";
import { CategoryModel } from "../models/category.model";
import { CollegeModel, type CollegeDocument } from "../models/college.model";
import { CutoffModel } from "../models/cutoff.model";
import { PlacementModel, type PlacementDocument } from "../models/placement.model";
import { AppError } from "../utils/app-error";
import type { CollegeSearchInput } from "../validators/admissions.validator";
import { districtSearchTerms, inferDistrictFromText } from "../utils/location-normalizer";

function regexFor(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function exactRegexFor(value: string) {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

export async function searchColleges(input: CollegeSearchInput) {
  const conditions: FilterQuery<CollegeDocument>[] = [];

  if (input.q) {
    const q = input.q.trim();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const textIds = await CollegeModel.find({ $text: { $search: q } })
      .select("_id")
      .lean()
      .then((docs) => docs.map((doc) => doc._id));

    const branchIds = await BranchModel.find({
      $or: [
        { code: new RegExp(`^${escaped}$`, "i") },
        { name: new RegExp(escaped, "i") },
        { aliases: new RegExp(escaped, "i") }
      ]
    })
      .select("_id")
      .lean();

    const branchCollegeIds = branchIds.length
      ? await CollegeModel.find({ branchIds: { $in: branchIds.map((branch) => branch._id) } })
          .select("_id")
          .lean()
          .then((docs) => docs.map((doc) => doc._id))
      : [];

    const district = inferDistrictFromText(q);
    const orConditions: FilterQuery<CollegeDocument>[] = [
      { name: new RegExp(escaped, "i") },
      { code: new RegExp(escaped, "i") },
      { city: new RegExp(escaped, "i") },
      { district: new RegExp(escaped, "i") },
      { affiliatedTo: new RegExp(escaped, "i") }
    ];

    if (textIds.length) orConditions.push({ _id: { $in: textIds } });
    if (branchCollegeIds.length) orConditions.push({ _id: { $in: branchCollegeIds } });
    if (district) orConditions.push({ district: exactRegexFor(district) });

    conditions.push({ $or: orConditions });
  }

  if (input.city) {
    const cityInput = input.city.trim();
    const { district, terms } = districtSearchTerms(cityInput);

    const cityOrCond: FilterQuery<CollegeDocument>[] = [];

    for (const term of terms) {
      const termRegex = regexFor(term);
      cityOrCond.push({ city: termRegex }, { district: termRegex });
    }

    if (district) {
      cityOrCond.push({ district: exactRegexFor(district) });
    }

    conditions.push({ $or: cityOrCond.length ? cityOrCond : [{ city: regexFor(cityInput) }, { district: regexFor(cityInput) }] });
  }

  if (input.state) {
    const stateEscaped = input.state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    conditions.push({ state: new RegExp(stateEscaped, "i") });
  }

  if (input.branchCode) {
    const branch = await BranchModel.findOne({ code: input.branchCode }).select("_id").lean();
    conditions.push({ branchIds: branch?._id ?? "__missing_branch__" });
  }

  if (input.nirfRankMin || input.nirfRankMax) {
    const nirfFilter: FilterQuery<CollegeDocument> = {};
    if (input.nirfRankMin) nirfFilter.$gte = input.nirfRankMin;
    if (input.nirfRankMax) nirfFilter.$lte = input.nirfRankMax;
    conditions.push({ "rankings.nirfRank": nirfFilter } as FilterQuery<CollegeDocument>);
  }

  if (input.placementPctMin != null) {
    conditions.push({ "placementDetails.placementPercentage": { $gte: input.placementPctMin } } as FilterQuery<CollegeDocument>);
  }

  if (input.hostelAvailable != null) {
    conditions.push({ hostelAvailable: input.hostelAvailable });
  }

  if (input.autonomous != null) {
    conditions.push({ autonomous: input.autonomous });
  }

  if (input.avgPackageMin != null) {
    conditions.push({ "placementDetails.averagePackage": { $gte: input.avgPackageMin } } as FilterQuery<CollegeDocument>);
  }

  if (input.campusType) {
    conditions.push({ campusType: new RegExp(input.campusType, "i") });
  }

  if (input.naacGrade) {
    conditions.push({ naacGrade: new RegExp(input.naacGrade, "i") });
  }

  const filter: FilterQuery<CollegeDocument> = conditions.length > 0 ? { $and: conditions } : {};

  const sort: Record<string, SortOrder> = {
    [input.sortBy]: input.sortDirection === "asc" ? 1 : -1
  };

  const skip = (input.page - 1) * input.pageSize;
  const [items, total, categories] = await Promise.all([
    CollegeModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(input.pageSize)
      .populate({ path: "branchIds", select: "code name", options: { sort: { name: 1 } } })
      .lean(),
    CollegeModel.countDocuments(filter),
    CategoryModel.find({}).sort({ code: 1 }).lean()
  ]);

  const placementMap = new Map<string, PlacementDocument & { _id: unknown }>();
  const placements = await Promise.all(
    items.map((college) =>
      PlacementModel.findOne({ collegeId: college._id }).sort({ academicYear: -1 }).lean()
    )
  );
  placements.forEach((placement, index) => {
    if (placement) {
      placementMap.set(items[index]._id.toString(), placement as PlacementDocument & { _id: unknown });
    }
  });

  return {
    items: items.map((college) => {
      const placement = placementMap.get(college._id.toString());
      return {
        id: college._id.toString(),
        code: college.code,
        name: college.name,
        city: college.city,
        district: college.district ?? null,
        state: college.state,
        website: college.website ?? null,
        autonomous: college.autonomous ?? false,
        affiliatedTo: college.affiliatedTo ?? null,
        naacGrade: college.naacGrade ?? null,
        hostelAvailable: college.hostelAvailable ?? false,
        campusType: college.campusType ?? null,
        branches: (college.branchIds as unknown as Array<{ _id: unknown; code: string; name: string }>).map(
          (branch) => ({
            id: String(branch._id),
            code: branch.code,
            name: branch.name
          })
        ),
        latestPlacement: placement
          ? {
              academicYear: placement.academicYear,
              medianPackageLpa: placement.medianPackageLpa?.toString() ?? null,
              averagePackageLpa: placement.averagePackageLpa?.toString() ?? null,
              placementRate: placement.placementRate?.toString() ?? null
            }
          : null
      };
    }),
    categories: categories.map((category) => ({
      id: category._id.toString(),
      code: category.code,
      name: category.name,
      group: category.group ?? null
    })),
    total,
    page: input.page,
    pageSize: input.pageSize
  };
}

export async function getCollegeById(collegeId: string) {
  const college = await CollegeModel.findById(collegeId)
    .populate({ path: "branchIds", select: "code name _id" })
    .lean();

  if (!college) {
    throw new AppError("College not found.", 404, "COLLEGE_NOT_FOUND");
  }

  const [placements, cutoffs, categoryList] = await Promise.all([
    PlacementModel.find({ collegeId: new Types.ObjectId(collegeId) }).sort({ academicYear: -1 }).lean(),
    CutoffModel.find({ collegeId: new Types.ObjectId(collegeId) })
      .populate({ path: "branchId", select: "code name" })
      .lean(),
    CategoryModel.find({}).sort({ code: 1 }).lean()
  ]);

  const categories: Record<string, { code: string; name: string }> = {};
  categoryList.forEach((cat) => {
    categories[cat.code] = { code: cat.code, name: cat.name };
  });

  const cutoffsByBranch: Record<string, unknown[]> = {};
  cutoffs.forEach((cutoff) => {
    const branchCode = (cutoff.branchId as unknown as { code: string }).code;
    if (!cutoffsByBranch[branchCode]) {
      cutoffsByBranch[branchCode] = [];
    }
    cutoffsByBranch[branchCode].push({
      round: cutoff.round,
      year: cutoff.year,
      rankOpen: cutoff.rankOpen ?? null,
      rankClose: cutoff.rankClose,
      category: cutoff.categoryCode,
      categoryName: categories[cutoff.categoryCode]?.name ?? cutoff.categoryCode,
      quota: cutoff.quota,
      seatType: cutoff.seatType,
      percentile: cutoff.percentile ?? null
    });
  });

  return {
    id: college._id.toString(),
    code: college.code,
    name: college.name,
    city: college.city,
    district: college.district ?? null,
    state: college.state,
    website: college.website ?? null,
    autonomous: college.autonomous ?? false,
    affiliatedTo: college.affiliatedTo ?? null,
    naacGrade: college.naacGrade ?? null,
    hostelAvailable: college.hostelAvailable ?? false,
    campusType: college.campusType ?? null,
    branches: (college.branchIds as unknown as Array<{ _id: unknown; code: string; name: string }>).map(
      (branch) => ({
        id: String(branch._id),
        code: branch.code,
        name: branch.name,
        cutoffs: (cutoffsByBranch[branch.code] ?? []).sort(
          (a: any, b: any) => (b.year - a.year) || (b.round - a.round)
        )
      })
    ),
    placements: placements.map((p) => ({
      academicYear: p.academicYear,
      medianPackageLpa: p.medianPackageLpa?.toString() ?? null,
      averagePackageLpa: p.averagePackageLpa?.toString() ?? null,
      highestPackageLpa: p.highestPackageLpa?.toString() ?? null,
      placementRate: p.placementRate?.toString() ?? null,
      recruiters: p.recruiters ?? []
    })),
    stats: {
      totalBranches: college.branchIds.length,
      totalCutoffs: cutoffs.length,
      totalPlacements: placements.length
    }
  };
}
