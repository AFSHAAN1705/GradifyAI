export type CategoryDto = {
  id: string;
  code: string;
  name: string;
  group?: string | null;
};

export type CollegeDto = {
  id: string;
  code: string;
  name: string;
  city: string;
  district: string | null;
  state: string;
  website: string | null;
  autonomous: boolean;
  affiliatedTo: string | null;
  naacGrade: string | null;
  hostelAvailable: boolean;
  campusType: string | null;
  branches: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  latestPlacement: {
    academicYear: string;
    medianPackageLpa: string | null;
    averagePackageLpa: string | null;
    placementRate: string | null;
  } | null;
};

export type CollegesResponse = {
  colleges: CollegeDto[];
  categories: CategoryDto[];
};

export type PredictionResultItem = {
  collegeId: string;
  collegeCode: string;
  collegeName: string;
  city: string;
  district: string;
  state: string;
  branchCode: string;
  branchName: string;
  categoryCode: string;
  year: number;
  round: number;
  rankClose: number;
  rankGap: number;
  confidence: "high" | "medium" | "reach";
  confidenceScore: number;
  tier: "dream" | "competitive" | "moderate" | "safe";
  tierLabel: string;
  upgradeChance: "low" | "medium" | "high";
  roundMovement: number | null;
  strategyNote: string;
  qualityScore: number;
  collegeTier: string;
  placementRate: number | null;
  averagePackage: number | null;
  highestPackage: number | null;
  naacGrade: string;
  autonomous: boolean;
  quickInsight: string;
};

export type PredictionResponse = {
  predictionId: string | null;
  generatedAt: string;
  input: {
    examRank: number;
    categoryCode: string;
    preferredCity?: string;
    round?: number;
    branchCodes: string[];
  };
  searchRange: {
    min: number;
    max: number;
    radius: number;
  };
  totalMatches: number;
  matches: PredictionResultItem[];
  buckets: {
    dream: PredictionResultItem[];
    competitive: PredictionResultItem[];
    moderate: PredictionResultItem[];
    safe: PredictionResultItem[];
  };
  counsellingStrategy: string[];
};
