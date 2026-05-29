import mongoose from "mongoose";
import { env } from "../config/env";
import { CollegeModel } from "../models/college.model";
import { inferCityFromText, inferDistrictFromText } from "../utils/location-normalizer";

async function fixDistricts() {
  try {
    console.log("Fixing district values for existing colleges...");
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const allColleges = await CollegeModel.find({}).lean();
    console.log(`Found ${allColleges.length} colleges`);

    let updated = 0;
    for (const college of allColleges) {
      const currentDistrict = (college.district || "").trim();
      const normalizedDistrict = inferDistrictFromText(college.name, college.city, college.district);
      const normalizedCity = inferCityFromText(college.name, college.city);

      if (
        normalizedDistrict &&
        (normalizedDistrict !== currentDistrict || (college.city || "") !== normalizedCity)
      ) {
        await CollegeModel.updateOne(
          { _id: college._id },
          { $set: { city: normalizedCity, district: normalizedDistrict } }
        );
        console.log(`  ${college.code} ${college.city || "(unknown)"} -> ${normalizedCity}, ${normalizedDistrict}`);
        updated++;
      }
    }

    console.log(`\nDone. Updated ${updated} colleges.`);
    await mongoose.connection.close();
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  fixDistricts();
}
