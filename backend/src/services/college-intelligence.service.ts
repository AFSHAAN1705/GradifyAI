import { Types } from "mongoose";
import { CollegeModel, type CollegeDocument } from "../models/college.model";
import { PlacementModel } from "../models/placement.model";
import { CutoffModel } from "../models/cutoff.model";
import { BranchModel } from "../models/branch.model";
import { ReviewModel } from "../models/review.model";
import { TrendModel } from "../models/trend.model";
import { AppError } from "../utils/app-error";

export async function getEnhancedCollegeDetail(collegeId: string) {
  const college = await CollegeModel.findById(collegeId)
    .populate({ path: "branchIds", select: "code name _id" })
    .lean();

  if (!college) {
    throw new AppError("College not found.", 404, "COLLEGE_NOT_FOUND");
  }

  const [placements, cutoffs, reviews, trends] = await Promise.all([
    PlacementModel.find({ collegeId: new Types.ObjectId(collegeId) }).sort({ academicYear: -1 }).lean(),
    CutoffModel.find({ collegeId: new Types.ObjectId(collegeId) })
      .populate({ path: "branchId", select: "code name" })
      .lean(),
    ReviewModel.find({ collegeId: new Types.ObjectId(collegeId), status: "APPROVED" }).sort({ createdAt: -1 }).limit(20).lean(),
    TrendModel.find({ collegeId: new Types.ObjectId(collegeId) }).sort({ year: -1 }).lean()
  ]);

  const branchesMap = new Map<string, { code: string; name: string }>();
  cutoffs.forEach((cutoff) => {
    const branch = cutoff.branchId as unknown as { code: string; name: string } | undefined;
    if (branch) branchesMap.set(branch.code, branch);
  });

  const placementByBranch: Record<string, typeof placements> = {};
  placements.forEach((p) => {
    const key = p.branchId?.toString() ?? "__overall__";
    if (!placementByBranch[key]) placementByBranch[key] = [];
    placementByBranch[key].push(p);
  });

  const branchIntake: Record<string, number> = {};
  const branchCutoffs: Record<string, unknown[]> = {};
  cutoffs.forEach((cutoff) => {
    const branchCode = (cutoff.branchId as unknown as { code: string })?.code ?? "UNKNOWN";
    if (!branchCutoffs[branchCode]) branchCutoffs[branchCode] = [];
    branchCutoffs[branchCode].push({
      round: cutoff.round,
      year: cutoff.year,
      rankOpen: cutoff.rankOpen ?? null,
      rankClose: cutoff.rankClose,
      category: cutoff.categoryCode,
      quota: cutoff.quota,
      seatType: cutoff.seatType,
    });
  });

  const topRecruitersSet = new Set<string>();
  placements.forEach((p) => {
    (p.recruiters ?? []).forEach((r) => topRecruitersSet.add(r));
    (p.topRecruiters ?? []).forEach((r) => topRecruitersSet.add(r));
  });

  return {
    id: college._id.toString(),
    code: college.code,
    name: college.name,
    shortName: college.shortName ?? "",
    address: college.address ?? "",
    pincode: college.pincode ?? "",
    city: college.city,
    district: college.district ?? "",
    state: college.state,
    logo: college.logo ?? "",
    website: college.website ?? "",
    contactNumber: college.contactNumber ?? "",
    email: college.email ?? "",
    establishedYear: college.establishedYear ?? null,
    collegeType: college.collegeType ?? "",
    autonomous: college.autonomous ?? false,
    affiliatedTo: college.affiliatedTo ?? "",
    latitude: college.latitude ?? null,
    longitude: college.longitude ?? null,
    naacGrade: college.naacGrade ?? "",
    hostelAvailable: college.hostelAvailable ?? false,
    campusType: college.campusType ?? "",
    campusSize: college.campusSize ?? "",
    campusImages: college.campusImages ?? [],
    virtualTour: college.virtualTour ?? "",
    boysHostel: college.boysHostel ?? false,
    girlsHostel: college.girlsHostel ?? false,
    wifiAvailable: college.wifiAvailable ?? false,
    libraryAvailable: college.libraryAvailable ?? false,
    labsWorkshops: college.labsWorkshops ?? false,
    sportsFacilities: college.sportsFacilities ?? false,
    cafeteria: college.cafeteria ?? false,
    medicalFacilities: college.medicalFacilities ?? false,
    auditorium: college.auditorium ?? false,
    transportation: college.transportation ?? false,

    fees: {
      tuition: college.fees?.tuition ?? null,
      hostelFees: college.fees?.hostelFees ?? null,
      miscellaneous: college.fees?.miscellaneous ?? null,
      scholarshipInfo: college.fees?.scholarshipInfo ?? "",
      educationLoanSupport: college.fees?.educationLoanSupport ?? false,
    },

    rankings: {
      nirfRank: college.rankings?.nirfRank ?? college.nirfRank ?? null,
      naacGrade: college.rankings?.naacGrade ?? college.naacGrade ?? "",
      nbaAccreditation: college.rankings?.nbaAccreditation ?? college.nbaAccreditation ?? false,
      stateRank: college.rankings?.stateRank ?? college.stateRank ?? null,
      aicteApproved: college.rankings?.aicteApproved ?? college.aicteApproved ?? true,
      affiliatedUniversity: college.rankings?.affiliatedUniversity ?? college.affiliatedTo ?? "",
    },

    placementDetails: {
      placementPercentage: college.placementDetails?.placementPercentage ?? null,
      averagePackage: college.placementDetails?.averagePackage ?? null,
      medianPackage: college.placementDetails?.medianPackage ?? null,
      highestPackage: college.placementDetails?.highestPackage ?? null,
      placementScore: college.placementDetails?.placementScore ?? null,
      roiScore: college.placementDetails?.roiScore ?? null,
      placementTrends: college.placementDetails?.placementTrends ?? [],
      branchWisePlacements: college.placementDetails?.branchWisePlacements ?? [],
      internshipStats: college.placementDetails?.internshipStats ?? { internshipPercentage: null, avgStipend: null },
      recruiterLogos: college.placementDetails?.recruiterLogos ?? [],
      topRecruiters: college.placementDetails?.topRecruiters ?? [...topRecruitersSet].slice(0, 20),
      massRecruiters: college.placementDetails?.massRecruiters ?? [],
      placementGrowthTrend: college.placementDetails?.placementGrowthTrend ?? "",
      verifiedBadge: college.placementDetails?.verifiedBadge ?? false,
      confidenceScore: college.placementDetails?.confidenceScore ?? null,
      verificationSource: college.placementDetails?.verificationSource ?? "",
    },

    researchCenters: college.researchCenters ?? [],
    patents: college.patents ?? null,
    publications: college.publications ?? null,
    startupIncubators: college.startupIncubators ?? false,
    innovationLabs: college.innovationLabs ?? false,
    industryCollaborations: college.industryCollaborations ?? [],

    studentLife: {
      clubs: college.studentLife?.clubs ?? [],
      hackathons: college.studentLife?.hackathons ?? false,
      fests: college.studentLife?.fests ?? [],
      codingCultureScore: college.studentLife?.codingCultureScore ?? null,
      campusLifeScore: college.studentLife?.campusLifeScore ?? null,
      innovationCulture: college.studentLife?.innovationCulture ?? false,
      pros: college.studentLife?.pros ?? [],
      cons: college.studentLife?.cons ?? [],
    },

    districtData: {
      costOfLiving: college.districtData?.costOfLiving ?? "",
      connectivity: college.districtData?.connectivity ?? "",
      popularBranches: college.districtData?.popularBranches ?? [],
      topCollegesCount: college.districtData?.topCollegesCount ?? null,
      averagePlacementRate: college.districtData?.averagePlacementRate ?? null,
      hostelAvailability: college.districtData?.hostelAvailability ?? "",
    },

    branches: (college.branchIds as unknown as Array<{ _id: unknown; code: string; name: string }>).map((branch) => ({
      id: String(branch._id),
      code: branch.code,
      name: branch.name,
    })),

    branchAnalytics: (college.branchIds as unknown as Array<{ _id: unknown; code: string; name: string }>).map((branch) => {
      const branchPlacements = placementByBranch[branch._id.toString()] ?? [];
      const latest = branchPlacements[0];
      return {
        code: branch.code,
        name: branch.name,
        intake: branchIntake[branch.code] ?? 0,
        cutoffTrend: (branchCutoffs[branch.code] ?? []).slice(0, 3),
        averagePackage: latest?.averagePackageLpa ?? null,
        placementPercentage: latest?.placementPercentage ?? latest?.placementRate ?? null,
        recruiters: latest?.recruiters ?? [],
        topRecruiters: latest?.topRecruiters ?? [],
      };
    }),

    placements: placements.map((p) => ({
      academicYear: p.academicYear,
      medianPackageLpa: p.medianPackageLpa?.toString() ?? null,
      averagePackageLpa: p.averagePackageLpa?.toString() ?? null,
      highestPackageLpa: p.highestPackageLpa?.toString() ?? null,
      placementRate: p.placementRate?.toString() ?? null,
      placementPercentage: p.placementPercentage ?? null,
      internshipPercentage: p.internshipPercentage ?? null,
      avgStipend: p.avgStipend ?? null,
      totalStudents: p.totalStudents ?? null,
      studentsPlaced: p.studentsPlaced ?? null,
      studentsInternship: p.studentsInternship ?? null,
      recruiters: p.recruiters ?? [],
      topRecruiters: p.topRecruiters ?? [],
      massRecruiters: p.massRecruiters ?? [],
      verified: p.verified ?? false,
      verificationSource: p.verificationSource ?? "",
      confidenceScore: p.confidenceScore ?? null,
    })),

    reviews: reviews.map((r) => ({
      id: r._id.toString(),
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt,
    })),

    stats: {
      totalBranches: college.branchIds.length,
      totalCutoffs: cutoffs.length,
      totalPlacements: placements.length,
      totalReviews: reviews.length,
    },
  };
}

export async function getDistrictColleges(district: string) {
  const colleges = await CollegeModel.find({
    district: { $regex: new RegExp(district, "i") },
  })
    .populate({ path: "branchIds", select: "code name" })
    .sort({ name: 1 })
    .lean();

  const collegeIds = colleges.map((c) => c._id);

  const [placements, trends] = await Promise.all([
    PlacementModel.find({ collegeId: { $in: collegeIds } }).sort({ academicYear: -1 }).lean(),
    TrendModel.find({ collegeId: { $in: collegeIds } }).sort({ year: -1 }).lean(),
  ]);

  const placementMap = new Map<string, typeof placements>();
  placements.forEach((p) => {
    const key = p.collegeId.toString();
    if (!placementMap.has(key)) placementMap.set(key, []);
    placementMap.get(key)!.push(p);
  });

  return {
    district,
    totalColleges: colleges.length,
    colleges: colleges.map((c) => ({
      id: c._id.toString(),
      code: c.code,
      name: c.name,
      city: c.city,
      autonomous: c.autonomous ?? false,
      naacGrade: c.naacGrade ?? "",
      hostelAvailable: c.hostelAvailable ?? false,
      campusType: c.campusType ?? "",
      branches: (c.branchIds as unknown as Array<{ code: string; name: string }>).map((b) => ({
        code: b.code,
        name: b.name,
      })),
      latestPlacement: (placementMap.get(c._id.toString()) ?? [])[0]
        ? {
            academicYear: (placementMap.get(c._id.toString()) ?? [])[0]?.academicYear,
            averagePackageLpa: (placementMap.get(c._id.toString()) ?? [])[0]?.averagePackageLpa?.toString() ?? null,
            placementRate: (placementMap.get(c._id.toString()) ?? [])[0]?.placementRate?.toString() ?? null,
          }
        : null,
      placementDetails: {
        averagePackage: c.placementDetails?.averagePackage ?? null,
        placementPercentage: c.placementDetails?.placementPercentage ?? null,
        highestPackage: c.placementDetails?.highestPackage ?? null,
      },
    })),
  };
}

export async function compareColleges(collegeIds: string[]) {
  if (!collegeIds.length || collegeIds.length > 5) {
    throw new AppError("Compare between 2 and 5 colleges.", 400, "INVALID_COMPARE_COUNT");
  }

  const objectIds = collegeIds.map((id) => new Types.ObjectId(id));
  const colleges = await CollegeModel.find({ _id: { $in: objectIds } })
    .populate({ path: "branchIds", select: "code name" })
    .lean();

  if (colleges.length !== collegeIds.length) {
    throw new AppError("One or more colleges not found.", 404, "COLLEGES_NOT_FOUND");
  }

  const allPlacements = await PlacementModel.find({ collegeId: { $in: objectIds } })
    .sort({ academicYear: -1 })
    .lean();

  const placementsByCollege = new Map<string, typeof allPlacements>();
  allPlacements.forEach((p) => {
    const key = p.collegeId.toString();
    if (!placementsByCollege.has(key)) placementsByCollege.set(key, []);
    placementsByCollege.get(key)!.push(p);
  });

  return colleges.map((c) => {
    const cPlacements = placementsByCollege.get(c._id.toString()) ?? [];
    const latest = cPlacements[0];
    return {
      id: c._id.toString(),
      code: c.code,
      name: c.name,
      city: c.city,
      district: c.district ?? "",
      autonomous: c.autonomous ?? false,
      naacGrade: c.naacGrade ?? "",
      hostelAvailable: c.hostelAvailable ?? false,
      campusType: c.campusType ?? "",
      campusSize: c.campusSize ?? "",
      website: c.website ?? "",
      branches: (c.branchIds as unknown as Array<{ code: string; name: string }>).map((b) => b.code),
      totalBranches: c.branchIds.length,
      placementDetails: {
        placementPercentage: c.placementDetails?.placementPercentage ?? latest?.placementRate ?? null,
        averagePackage: c.placementDetails?.averagePackage ?? latest?.averagePackageLpa ?? null,
        medianPackage: c.placementDetails?.medianPackage ?? latest?.medianPackageLpa ?? null,
        highestPackage: c.placementDetails?.highestPackage ?? latest?.highestPackageLpa ?? null,
        placementScore: c.placementDetails?.placementScore ?? null,
        roiScore: c.placementDetails?.roiScore ?? null,
        topRecruiters: c.placementDetails?.topRecruiters ?? latest?.recruiters ?? [],
      },
      fees: {
        tuition: c.fees?.tuition ?? null,
        hostelFees: c.fees?.hostelFees ?? null,
      },
      rankings: {
        nirfRank: c.rankings?.nirfRank ?? c.nirfRank ?? null,
        naacGrade: c.rankings?.naacGrade ?? c.naacGrade ?? "",
        nbaAccreditation: c.rankings?.nbaAccreditation ?? c.nbaAccreditation ?? false,
        stateRank: c.rankings?.stateRank ?? c.stateRank ?? null,
      },
      studentLife: {
        codingCultureScore: c.studentLife?.codingCultureScore ?? null,
        campusLifeScore: c.studentLife?.campusLifeScore ?? null,
      },
      verifiedBadge: c.placementDetails?.verifiedBadge ?? false,
    };
  });
}

export async function verifyPlacement(collegeId: string) {
  const college = await CollegeModel.findById(collegeId).lean();
  if (!college) throw new AppError("College not found.", 404, "COLLEGE_NOT_FOUND");

  const placements = await PlacementModel.find({ collegeId: new Types.ObjectId(collegeId) })
    .sort({ academicYear: -1 })
    .lean();

  const latestPlacement = placements[0];
  if (!latestPlacement) {
    return { verified: false, confidenceScore: 0, verificationSource: "No placement data available" };
  }

  const hasNirfData = college.placementDetails?.placementPercentage != null;
  const hasOfficialData = latestPlacement.verified || latestPlacement.verificationSource.length > 0;
  const dataCompleteness = [
    latestPlacement.averagePackageLpa != null,
    latestPlacement.highestPackageLpa != null,
    latestPlacement.placementRate != null,
    latestPlacement.totalStudents != null,
    latestPlacement.studentsPlaced != null,
    (latestPlacement.recruiters ?? []).length > 0,
  ].filter(Boolean).length / 6;

  let confidenceScore = 0;
  let source = "Self-reported";

  if (hasNirfData && hasOfficialData) {
    confidenceScore = 90 + Math.round(dataCompleteness * 10);
    source = "NIRF Report + Official Data";
  } else if (hasNirfData) {
    confidenceScore = 70 + Math.round(dataCompleteness * 20);
    source = "NIRF Report";
  } else if (hasOfficialData) {
    confidenceScore = 60 + Math.round(dataCompleteness * 25);
    source = "Official College Data";
  } else {
    confidenceScore = Math.round(dataCompleteness * 50);
    source = "Estimated from trends";
  }

  return {
    verified: confidenceScore >= 60,
    confidenceScore: Math.min(confidenceScore, 99),
    verificationSource: source,
    dataCompleteness: Math.round(dataCompleteness * 100),
    hasNirfData,
    hasOfficialData,
    totalPlacementYears: placements.length,
    latestYear: latestPlacement.academicYear,
  };
}

export async function getAdmissionsAdvice(collegeId: string) {
  const college = await CollegeModel.findById(collegeId).lean();
  if (!college) throw new AppError("College not found.", 404, "COLLEGE_NOT_FOUND");

  const cutoffs = await CutoffModel.find({ collegeId: new Types.ObjectId(collegeId) })
    .sort({ year: -1, round: -1 })
    .limit(50)
    .lean();

  const placements = await PlacementModel.find({ collegeId: new Types.ObjectId(collegeId) })
    .sort({ academicYear: -1 })
    .limit(10)
    .lean();

  const latestPlacement = placements[0];
  const latestCutoffs = cutoffs.filter((c) => c.categoryCode === "GM").slice(0, 5);
  const minRank = latestCutoffs.length ? Math.min(...latestCutoffs.map((c) => c.rankClose)) : 0;
  const maxRank = latestCutoffs.length ? Math.max(...latestCutoffs.map((c) => c.rankClose)) : 0;

  return {
    collegeId: college._id.toString(),
    collegeName: college.name,
    cutoffsAvailable: cutoffs.length,
    placementsAvailable: placements.length,
    rankRange: minRank && maxRank ? { min: minRank, max: maxRank } : null,
    placementRate: latestPlacement?.placementRate ?? null,
    averagePackage: latestPlacement?.averagePackageLpa ?? null,
    highestPackage: latestPlacement?.highestPackageLpa ?? null,
  };
}
