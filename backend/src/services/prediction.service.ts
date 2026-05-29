import { Types } from "mongoose";
import { BranchModel } from "../models/branch.model";
import { CollegeModel, type CollegeDocument } from "../models/college.model";
import { CutoffModel } from "../models/cutoff.model";
import { PlacementModel } from "../models/placement.model";
import { PredictionModel } from "../models/prediction.model";
import { AppError } from "../utils/app-error";
import { districtSearchTerms } from "../utils/location-normalizer";
import type { PredictionRequest } from "../validators/admissions.validator";

type PopulatedCutoff = {
  _id: unknown;
  collegeId: { _id: unknown; code: string; name: string; city: string; district?: string; state: string };
  branchId: { _id: unknown; code: string; name: string };
  categoryCode: string;
  year: number;
  round: number;
  rankClose: number;
};

type CollegeQualityData = {
  placementRate: number | null;
  averagePackage: number | null;
  highestPackage: number | null;
  naacGrade: string;
  autonomous: boolean;
  nirfRank: number | null;
  placementScore: number | null;
  roiScore: number | null;
  codingCultureScore: number | null;
};

// College quality scoring constants
const QUALITY_WEIGHTS = {
  placements: 0.40,
  reputation: 0.20,
  accreditation: 0.10,
  autonomous: 0.10,
  cutoffStrength: 0.10,
  popularity: 0.10,
};

function computeQualityScore(data: CollegeQualityData, rankClose: number): number {
  // Placements score (0-40)
  let placementScore = 0;
  if (data.placementScore != null) {
    placementScore = (data.placementScore / 100) * 40;
  } else if (data.placementRate != null) {
    placementScore = (data.placementRate / 100) * 20 + (Math.min((data.averagePackage ?? 0) / 30, 1)) * 20;
  } else {
    placementScore = 10;
  }

  // Reputation score (0-20) based on NIRF rank
  let reputationScore = 10;
  if (data.nirfRank != null) {
    if (data.nirfRank <= 50) reputationScore = 20;
    else if (data.nirfRank <= 100) reputationScore = 18;
    else if (data.nirfRank <= 150) reputationScore = 15;
    else if (data.nirfRank <= 200) reputationScore = 12;
  } else if (data.placementRate != null && data.placementRate > 90) {
    reputationScore = 16;
  }

  // Accreditation score (0-10)
  const naacScore = data.naacGrade.includes("A++") ? 10
    : data.naacGrade.includes("A+") ? 8
    : data.naacGrade.includes("A") ? 6
    : data.naacGrade.includes("B") ? 4
    : 2;

  // Autonomous score (0-10)
  const autoScore = data.autonomous ? 10 : 4;

  // Cutoff strength score (0-10)
  const cutoffScore = Math.min(10, Math.max(1, Math.round(10 - (rankClose / 200000) * 10)));

  // Popularity / coding culture (0-10)
  const popScore = data.codingCultureScore != null
    ? (data.codingCultureScore / 100) * 10
    : 5;

  const total = Math.min(100, Math.round(
    placementScore + reputationScore + naacScore + autoScore + cutoffScore + popScore
  ));

  return total;
}

function collegeTier(score: number): string {
  if (score >= 88) return "Tier 1";
  if (score >= 78) return "Tier 1.5";
  if (score >= 65) return "Tier 2";
  if (score >= 50) return "Tier 2.5";
  return "Tier 3";
}

function quickInsight(score: number, tier: string, placementRate: number | null, avgPackage: number | null): string {
  if (tier === "Tier 1") {
    return "Excellent placements and strong reputation in Karnataka. Top-tier choice for any student.";
  }
  if (tier === "Tier 1.5") {
    return "Strong academic reputation with competitive placements. Highly recommended for most branches.";
  }
  if (tier === "Tier 2") {
    return "Good backup option with decent placements. Reliable choice with solid academic standards.";
  }
  if (tier === "Tier 2.5") {
    return "Decent option with satisfactory outcomes. Suitable for moderate rank holders.";
  }
  if (placementRate != null && placementRate > 85) {
    return "Strong placement record despite lower cutoff. Good value-for-rank option.";
  }
  if (avgPackage != null && avgPackage > 6) {
    return "Above-average packages offered. Worth considering if rank permits.";
  }
  return "Suitable safe option with high admission probability.";
}

type Tier = "dream" | "competitive" | "moderate" | "safe";

function tierFor(rankGap: number): Tier {
  if (rankGap < 0) return "dream";
  if (rankGap < 5_000) return "competitive";
  if (rankGap < 10_000) return "moderate";
  return "safe";
}

function confidenceFor(rankClose: number, examRank: number, movement: number | null) {
  const rankGap = rankClose - examRank;
  const base = rankGap >= 0
    ? 58 + Math.min(32, Math.round((rankGap / Math.max(rankClose, 1)) * 100))
    : 42 + Math.min(20, Math.round((Math.abs(rankGap) / Math.max(rankClose, 1)) * 100));
  const movementBoost = movement && movement > 0 ? Math.min(12, Math.round(movement / 1000)) : 0;
  const score = Math.max(18, Math.min(96, base + movementBoost));

  if (score >= 78) return { label: "high" as const, score };
  if (score >= 55) return { label: "medium" as const, score };
  return { label: "reach" as const, score };
}

function upgradeChance(rankGap: number, movement: number | null) {
  if ((movement ?? 0) > 4_000 || rankGap > 8_000) return "high" as const;
  if ((movement ?? 0) > 1_200 || rankGap >= 0) return "medium" as const;
  return "low" as const;
}

function labelFor(tier: Tier) {
  switch (tier) {
    case "dream": return "Highly Competitive";
    case "competitive": return "Possible Chance";
    case "moderate": return "Good Probability";
    case "safe": return "Very Safe";
  }
}

function strategyFor(tier: Tier, round: number, movement: number | null) {
  switch (tier) {
    case "dream":
      return round < 3 && (movement ?? 0) > 0
        ? "Keep this option high in preference — round-to-round movement may create an opening."
        : "Aggressive reach. Consider only if comfortable waiting for extended round movement.";
    case "competitive":
      return "Borderline option. Worth including in your choices — cutoff trends may shift in your favour.";
    case "moderate":
      return "Balanced choice. Good candidate for upgrade tracking in subsequent rounds.";
    case "safe":
      return "Strong fallback. Provides counselling stability and allotment certainty.";
  }
}

async function movementFor(candidate: PopulatedCutoff) {
  const previousRound = await CutoffModel.findOne({
    collegeId: candidate.collegeId._id,
    branchId: candidate.branchId._id,
    categoryCode: candidate.categoryCode,
    year: candidate.year,
    round: candidate.round - 1
  })
    .select("rankClose")
    .lean();

  return previousRound ? candidate.rankClose - previousRound.rankClose : null;
}

function regexFor(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function exactRegexFor(value: string) {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

function cityToDistrictFilter(input: string) {
  const { district, terms } = districtSearchTerms(input);
  const orConditions = terms.flatMap((term) => [{ city: regexFor(term) }, { district: regexFor(term) }]);
  if (district) orConditions.push({ district: exactRegexFor(district) });
  return { $or: orConditions.length ? orConditions : [{ city: regexFor(input) }, { district: regexFor(input) }] };
}

export async function predictAdmissions(input: PredictionRequest, userId?: string) {
  // Dynamic radius based on input rank
  let rankRadius = 6_000;
  if (input.examRank <= 10_000) rankRadius = 3_000;
  else if (input.examRank <= 30_000) rankRadius = 6_000;
  else if (input.examRank <= 60_000) rankRadius = 10_000;
  else rankRadius = 15_000;

  const minRank = Math.max(1, input.examRank - rankRadius);

  const filter: Record<string, unknown> = {
    categoryCode: input.categoryCode,
    rankClose: { $gte: minRank }
  };

  if (input.round) {
    filter.round = input.round;
  }

  if (input.preferredCity) {
    const colleges = await CollegeModel.find(cityToDistrictFilter(input.preferredCity))
      .select("_id")
      .lean();
    filter.collegeId = { $in: colleges.length ? colleges.map((c) => c._id) : ["__none__"] };
  }

  if (input.branchCodes.length) {
    const branches = await BranchModel.find({ code: { $in: input.branchCodes } }).select("_id").lean();
    filter.branchId = { $in: branches.map((branch) => branch._id) };
  }

  const candidates = (await CutoffModel.find(filter)
    .sort({ year: -1, round: 1, rankClose: 1 })
    .populate("collegeId", "code name city state district")
    .populate("branchId", "code name")
    .lean()) as unknown as PopulatedCutoff[];

  if (!candidates.length) {
    throw new AppError(
      `No KCET cutoff records found from rank ${minRank.toLocaleString()} and above for ${input.categoryCode}. Upload KEA cutoff PDFs or broaden filters.`,
      404,
      "NO_MATCHES"
    );
  }

  const uniqueCollegeIds = [...new Set(candidates.map((c) => (c.collegeId._id as any).toString()))];
  const qualityMap = new Map<string, CollegeQualityData>();

  if (uniqueCollegeIds.length > 0) {
    const objectIds = uniqueCollegeIds.map((id) => new Types.ObjectId(id));
    const [colleges, placements] = await Promise.all([
      CollegeModel.find({ _id: { $in: objectIds } })
        .select("naacGrade autonomous placementDetails studentLife.codingCultureScore rankings.nirfRank")
        .lean(),
      PlacementModel.aggregate([
        { $match: { collegeId: { $in: objectIds } } },
        { $sort: { academicYear: -1 } },
        { $group: {
            _id: "$collegeId",
            placementRate: { $first: "$placementRate" },
            averagePackageLpa: { $first: "$averagePackageLpa" },
            highestPackageLpa: { $first: "$highestPackageLpa" },
          }
        }
      ])
    ]);

    const placementMap = new Map<string, { placementRate: number | null; averagePackageLpa: number | null; highestPackageLpa: number | null }>();
    placements.forEach((p) => placementMap.set(p._id.toString(), p));

    colleges.forEach((col) => {
      const pid = col._id.toString();
      const placementData = placementMap.get(pid);
      qualityMap.set(pid, {
        placementRate: placementData?.placementRate ?? col.placementDetails?.placementPercentage ?? null,
        averagePackage: placementData?.averagePackageLpa ?? col.placementDetails?.averagePackage ?? null,
        highestPackage: placementData?.highestPackageLpa ?? col.placementDetails?.highestPackage ?? null,
        naacGrade: col.naacGrade ?? col.rankings?.naacGrade ?? "",
        autonomous: col.autonomous ?? col.rankings?.nbaAccreditation ?? false,
        nirfRank: col.rankings?.nirfRank ?? col.nirfRank ?? null,
        placementScore: col.placementDetails?.placementScore ?? null,
        roiScore: col.placementDetails?.roiScore ?? null,
        codingCultureScore: col.studentLife?.codingCultureScore ?? null,
      });
    });

    // Fill missing entries with defaults
    uniqueCollegeIds.forEach((id) => {
      if (!qualityMap.has(id)) {
        qualityMap.set(id, {
          placementRate: null, averagePackage: null, highestPackage: null,
          naacGrade: "", autonomous: false, nirfRank: null,
          placementScore: null, roiScore: null, codingCultureScore: null,
        });
      }
    });
  }

  const ranked = await Promise.all(
    candidates.map(async (candidate) => {
      const movement = await movementFor(candidate);
      const rankGap = candidate.rankClose - input.examRank;
      const tier = tierFor(rankGap);
      const confidence = confidenceFor(candidate.rankClose, input.examRank, movement);

      const collegeIdStr = (candidate.collegeId._id as any).toString();
      const quality = qualityMap.get(collegeIdStr) ?? {
        placementRate: null, averagePackage: null, highestPackage: null,
        naacGrade: "", autonomous: false, nirfRank: null,
        placementScore: null, roiScore: null, codingCultureScore: null,
      };
      const qualityScore = computeQualityScore(quality, candidate.rankClose);
      const colTier = collegeTier(qualityScore);

      return {
        collegeId: collegeIdStr,
        collegeCode: candidate.collegeId.code,
        collegeName: candidate.collegeId.name,
        city: candidate.collegeId.city,
        district: (candidate.collegeId as any).district ?? candidate.collegeId.city,
        state: candidate.collegeId.state,
        branchCode: candidate.branchId.code,
        branchName: candidate.branchId.name,
        categoryCode: candidate.categoryCode,
        year: candidate.year,
        round: candidate.round,
        rankClose: candidate.rankClose,
        rankGap,
        confidence: confidence.label,
        confidenceScore: confidence.score,
        tier,
        tierLabel: labelFor(tier),
        upgradeChance: upgradeChance(rankGap, movement),
        roundMovement: movement,
        strategyNote: strategyFor(tier, candidate.round, movement),
        qualityScore,
        collegeTier: colTier,
        placementRate: quality.placementRate,
        averagePackage: quality.averagePackage,
        highestPackage: quality.highestPackage,
        naacGrade: quality.naacGrade,
        autonomous: quality.autonomous,
        quickInsight: quickInsight(qualityScore, colTier, quality.placementRate, quality.averagePackage),
      };
    })
  );

  // Sort by quality score descending (best college first)
  const sortedMatches = ranked.sort((a, b) => {
    const qDiff = b.qualityScore - a.qualityScore;
    if (qDiff !== 0) return qDiff;
    // If same quality, sort by admission probability (safer first)
    const tierOrder: Record<Tier, number> = { safe: 0, moderate: 1, competitive: 2, dream: 3 };
    return tierOrder[a.tier as Tier] - tierOrder[b.tier as Tier];
  });

  const buckets = {
    dream: sortedMatches.filter((match) => match.tier === "dream"),
    competitive: sortedMatches.filter((match) => match.tier === "competitive"),
    moderate: sortedMatches.filter((match) => match.tier === "moderate"),
    safe: sortedMatches.filter((match) => match.tier === "safe")
  };

  const qualityTiers = [...new Set(sortedMatches.map((m) => m.collegeTier))].sort();
  const tierSummary = qualityTiers
    .map((t) => {
      const count = sortedMatches.filter((m) => m.collegeTier === t).length;
      return `${t}: ${count} colleges`;
    })
    .join(", ");

  const counsellingStrategy = [
    `Search range: Rank ${minRank.toLocaleString()} and above (±${rankRadius.toLocaleString()}) for ${input.categoryCode}.`,
    `Found ${sortedMatches.length} eligible college-branch combinations. Quality tiers: ${tierSummary}.`,
    `Top match: ${sortedMatches[0]?.collegeName} (${sortedMatches[0]?.collegeTier}, Score: ${sortedMatches[0]?.qualityScore}/100).`,
    input.round
      ? `You selected Round ${input.round}; predictions are constrained to that round's data.`
      : "Compare Round 1, Round 2, and Extended Round results before locking option order.",
    buckets.dream.length
      ? `Dream: ${buckets.dream.length} options — these require significant cutoff movement.`
      : "No dream options in this range.",
    buckets.competitive.length
      ? `Competitive: ${buckets.competitive.length} borderline colleges.`
      : "No competitive options in this range.",
    buckets.moderate.length
      ? `Moderate: ${buckets.moderate.length} realistic targets.`
      : "No moderate options in this range.",
    buckets.safe.length
      ? `Safe: ${buckets.safe.length} strong fallbacks.`
      : "No safe options in this range.",
    "Tip: Broaden branch or city preferences to see more colleges."
  ];

  const result = {
    generatedAt: new Date().toISOString(),
    input: {
      examRank: input.examRank,
      categoryCode: input.categoryCode,
      preferredCity: input.preferredCity,
      round: input.round,
      branchCodes: input.branchCodes
    },
    searchRange: { min: minRank, max: 999999999, radius: rankRadius },
    totalMatches: sortedMatches.length,
    matches: sortedMatches,
    buckets,
    counsellingStrategy
  };

  const record = input.save
    ? await PredictionModel.create({
        userId: userId ? new Types.ObjectId(userId) : undefined,
        examRank: input.examRank,
        categoryCode: input.categoryCode,
        preferredCity: input.preferredCity,
        branchCodes: input.branchCodes,
        status: "SAVED",
        result
      })
    : null;

  return { predictionId: record?._id.toString() ?? null, ...result };
}
