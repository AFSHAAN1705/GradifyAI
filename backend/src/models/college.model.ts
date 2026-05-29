import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const collegeSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 24 },
    name: { type: String, required: true, trim: true, maxlength: 240 },
    shortName: { type: String, trim: true, maxlength: 60, default: "" },
    city: { type: String, required: true, trim: true, maxlength: 80, index: true },
    district: { type: String, trim: true, maxlength: 80, index: true, default: "" },
    state: { type: String, required: true, trim: true, maxlength: 80, index: true },
    address: { type: String, trim: true, maxlength: 500, default: "" },
    pincode: { type: String, trim: true, maxlength: 10, default: "" },
    website: { type: String, trim: true },
    contactNumber: { type: String, trim: true, maxlength: 20, default: "" },
    email: { type: String, trim: true, maxlength: 120, default: "" },
    establishedYear: { type: Number },
    collegeType: { type: String, trim: true, maxlength: 60, default: "" },
    latitude: Number,
    longitude: Number,
    logo: { type: String, trim: true, default: "" },
    branchIds: [{ type: Schema.Types.ObjectId, ref: "Branch", index: true }],
    autonomous: { type: Boolean, default: false },
    affiliatedTo: { type: String, trim: true, maxlength: 120, default: "" },
    naacGrade: { type: String, trim: true, maxlength: 20, default: "" },
    nbaAccreditation: { type: Boolean, default: false },
    nirfRank: { type: Number },
    stateRank: { type: Number },
    aicteApproved: { type: Boolean, default: true },
    hostelAvailable: { type: Boolean, default: false },
    campusType: { type: String, trim: true, maxlength: 60, default: "" },
    campusSize: { type: String, trim: true, maxlength: 60, default: "" },
    campusImages: [{ type: String, trim: true }],
    virtualTour: { type: String, trim: true, default: "" },
    boysHostel: { type: Boolean, default: false },
    girlsHostel: { type: Boolean, default: false },
    wifiAvailable: { type: Boolean, default: false },
    libraryAvailable: { type: Boolean, default: false },
    labsWorkshops: { type: Boolean, default: false },
    sportsFacilities: { type: Boolean, default: false },
    cafeteria: { type: Boolean, default: false },
    medicalFacilities: { type: Boolean, default: false },
    auditorium: { type: Boolean, default: false },
    transportation: { type: Boolean, default: false },

    fees: {
      tuition: { type: Number },
      hostelFees: { type: Number },
      miscellaneous: { type: Number },
      scholarshipInfo: { type: String, trim: true, maxlength: 500, default: "" },
      educationLoanSupport: { type: Boolean, default: false }
    },

    rankings: {
      nirfRank: { type: Number },
      naacGrade: { type: String, trim: true, maxlength: 20, default: "" },
      nbaAccreditation: { type: Boolean, default: false },
      stateRank: { type: Number },
      aicteApproved: { type: Boolean, default: true },
      affiliatedUniversity: { type: String, trim: true, maxlength: 120, default: "" }
    },

    placementDetails: {
      placementPercentage: { type: Number },
      averagePackage: { type: Number },
      medianPackage: { type: Number },
      highestPackage: { type: Number },
      placementScore: { type: Number },
      roiScore: { type: Number },
      placementTrends: [{
        year: { type: Number },
        placementRate: { type: Number },
        averagePackage: { type: Number },
        highestPackage: { type: Number }
      }],
      branchWisePlacements: [{
        branch: { type: String, trim: true },
        averagePackage: { type: Number },
        placementPercentage: { type: Number },
        highestPackage: { type: Number },
        recruiters: [{ type: String, trim: true }]
      }],
      internshipStats: {
        internshipPercentage: { type: Number },
        avgStipend: { type: Number }
      },
      recruiterLogos: [{ type: String, trim: true }],
      topRecruiters: [{ type: String, trim: true }],
      massRecruiters: [{ type: String, trim: true }],
      placementGrowthTrend: { type: String, trim: true, maxlength: 200, default: "" },
      verifiedBadge: { type: Boolean, default: false },
      confidenceScore: { type: Number },
      verificationSource: { type: String, trim: true, maxlength: 200, default: "" }
    },

    researchCenters: [{ type: String, trim: true }],
    patents: { type: Number },
    publications: { type: Number },
    startupIncubators: { type: Boolean, default: false },
    innovationLabs: { type: Boolean, default: false },
    industryCollaborations: [{ type: String, trim: true }],

    studentLife: {
      clubs: [{ type: String, trim: true }],
      hackathons: { type: Boolean, default: false },
      fests: [{ type: String, trim: true }],
      codingCultureScore: { type: Number },
      campusLifeScore: { type: Number },
      innovationCulture: { type: Boolean, default: false },
      pros: [{ type: String, trim: true }],
      cons: [{ type: String, trim: true }]
    },

    districtData: {
      costOfLiving: { type: String, trim: true, maxlength: 60, default: "" },
      connectivity: { type: String, trim: true, maxlength: 200, default: "" },
      popularBranches: [{ type: String, trim: true }],
      topCollegesCount: { type: Number },
      averagePlacementRate: { type: Number },
      hostelAvailability: { type: String, trim: true, maxlength: 60, default: "" }
    }
  },
  { timestamps: true, collection: "colleges" }
);

collegeSchema.index({ name: "text", code: "text", city: "text", district: "text" });
collegeSchema.index({ state: 1, city: 1, district: 1 });
collegeSchema.index({ "placementDetails.placementPercentage": 1 });
collegeSchema.index({ "placementDetails.averagePackage": 1 });
collegeSchema.index({ "rankings.nirfRank": 1 });
collegeSchema.index({ "placementDetails.roiScore": 1 });
collegeSchema.index({ "fees.tuition": 1 });

export type CollegeDocument = InferSchemaType<typeof collegeSchema>;
export const CollegeModel =
  (models.College as Model<CollegeDocument> | undefined) || model<CollegeDocument>("College", collegeSchema);
