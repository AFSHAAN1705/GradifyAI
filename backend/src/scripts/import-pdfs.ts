import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { env } from "../config/env";
import { ingestCutoffPdf } from "../services/pdf-ingestion.service";
import { ImportLogModel } from "../models/importLog.model";
import { CategoryModel } from "../models/category.model";
import { BranchModel } from "../models/branch.model";
import { CollegeModel } from "../models/college.model";
import { CutoffModel } from "../models/cutoff.model";
import { KCET_CATEGORIES } from "../config/constants";
import bcrypt from "bcryptjs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function inferRoundFromFileName(fileName: string): number {
  const match = fileName.match(/(\d+)(?:st|nd|rd|th)?[\s_-]*[Rr]ound/i);
  return match ? parseInt(match[1]) : 1;
}

function inferYearFromFileName(fileName: string): number {
  const match = fileName.match(/(20\d{2})/);
  return match ? parseInt(match[1]) : 2025;
}

async function initializeDatabase() {
  console.log("🌱 Initializing database with categories and branches...");

  for (const cat of KCET_CATEGORIES) {
    await CategoryModel.findOneAndUpdate(
      { code: cat.code },
      {
        code: cat.code,
        name: cat.name,
        group: cat.group,
        tags: cat.tags || []
      },
      { upsert: true }
    );
  }
  console.log(`✅ Inserted ${KCET_CATEGORIES.length} categories`);

  const standardBranches = [
    { code: "CSE", name: "Computer Science and Engineering" },
    { code: "ISE", name: "Information Science and Engineering" },
    { code: "ECE", name: "Electronics and Communication Engineering" },
    { code: "EEE", name: "Electrical and Electronics Engineering" },
    { code: "ME", name: "Mechanical Engineering" },
    { code: "CIV", name: "Civil Engineering" },
    { code: "TC", name: "Telecommunication Engineering" },
    { code: "IN", name: "Instrumentation Technology" },
    { code: "IT", name: "Information Technology" },
    { code: "IE", name: "Industrial Engineering and Management" },
    { code: "AU", name: "Automobile Engineering" },
    { code: "AERO", name: "Aeronautical Engineering" },
    { code: "BT", name: "Biotechnology" },
    { code: "ML", name: "Medical Electronics" },
    { code: "BM", name: "Biomedical Engineering" },
    { code: "CHE", name: "Chemical Engineering" },
    { code: "EV", name: "Environmental Engineering" },
    { code: "MT", name: "Metallurgical Engineering" },
    { code: "MN", name: "Mining Engineering" },
    { code: "PT", name: "Petroleum Engineering" },
    { code: "TX", name: "Textile Technology" },
    { code: "AR", name: "Architecture" },
    { code: "AG", name: "Agriculture" },
    { code: "HC", name: "Horticulture" },
    { code: "FR", name: "Forestry" },
    { code: "CS", name: "Community Science" },
    { code: "SR", name: "Sericulture" },
    { code: "FT", name: "Food Technology" },
    { code: "PM", name: "Polymer Science" },
    { code: "DT", name: "Dairy Technology" },
    { code: "FS", name: "Fisheries Science" },
    { code: "VH", name: "Veterinary Science" },
    { code: "AI", name: "Artificial Intelligence" },
    { code: "AI&DS", name: "Artificial Intelligence and Data Science" },
    { code: "AIML", name: "Artificial Intelligence and Machine Learning" },
    { code: "DS", name: "Data Science" },
    { code: "IOT", name: "Internet of Things" },
    { code: "CSM", name: "Computer Science and Machine Learning" },
    { code: "CSD", name: "Computer Science and Data Science" }
  ];

  for (const branch of standardBranches) {
    await BranchModel.findOneAndUpdate(
      { code: branch.code },
      branch,
      { upsert: true }
    );
  }
  console.log(`✅ Inserted ${standardBranches.length} branches`);

  console.log("📌 Colleges will be discovered dynamically from PDF data during import");

  const existingAdmin = await import("../models/user.model").then((m) => m.UserModel.findOne({ email: "admin@kcet.ai" }));
  if (!existingAdmin) {
    const { UserModel } = await import("../models/user.model");
    const passwordHash = await bcrypt.hash("admin123", 12);
    await UserModel.create({
      name: "KCET Admin",
      email: "admin@kcet.ai",
      passwordHash,
      role: "ADMIN"
    });
    console.log("✅ Created admin user (admin@kcet.ai / admin123)");
  }

  // 5. Create demo student user
  const { UserModel } = await import("../models/user.model");
  const existingStudent = await UserModel.findOne({ email: "student@demo.com" });
  if (!existingStudent) {
    const passwordHash = await bcrypt.hash("student123", 12);
    await UserModel.create({
      name: "Demo Student",
      email: "student@demo.com",
      passwordHash,
      role: "STUDENT"
    });
    console.log("✅ Created demo student (student@demo.com / student123)");
  }
}

async function removeInvalidNumericBranches() {
  const invalidBranches = await BranchModel.find({ code: /^\d+$/ }).select("_id code").lean();
  if (!invalidBranches.length) return;

  const invalidBranchIds = invalidBranches.map((branch) => branch._id);
  const cutoffDelete = await CutoffModel.deleteMany({ branchId: { $in: invalidBranchIds } });
  await CollegeModel.updateMany({}, { $pull: { branchIds: { $in: invalidBranchIds } } });
  const branchDelete = await BranchModel.deleteMany({ _id: { $in: invalidBranchIds } });

  console.log(
    `🧹 Removed ${branchDelete.deletedCount} invalid numeric branches and ${cutoffDelete.deletedCount} bad cutoffs from earlier malformed imports`
  );
}

function selectUniquePdfFiles(pdfFiles: string[]) {
  const selected = new Map<string, string>();

  for (const file of pdfFiles) {
    const filePath = path.join(UPLOAD_DIR, file);
    const size = fs.statSync(filePath).size;
    const key = `${inferYearFromFileName(file)}-${inferRoundFromFileName(file)}-${size}`;
    const existing = selected.get(key);

    if (!existing || (/^\d{10,}[-_]/.test(existing) && !/^\d{10,}[-_]/.test(file))) {
      selected.set(key, file);
    }
  }

  return [...selected.values()].sort((a, b) => {
    const yearDiff = inferYearFromFileName(a) - inferYearFromFileName(b);
    if (yearDiff !== 0) return yearDiff;
    return inferRoundFromFileName(a) - inferRoundFromFileName(b);
  });
}

async function processPdfFile(filePath: string) {
  const fileName = path.basename(filePath);
  const round = inferRoundFromFileName(fileName);
  const year = inferYearFromFileName(fileName);
  const fileSize = fs.statSync(filePath).size;
  const startedAt = Date.now();

  console.log(`\n📄 Processing: ${fileName}`);
  console.log(`   Round: ${round}, Year: ${year}`);

  try {
    const result = await ingestCutoffPdf({
      filePath,
      originalName: fileName,
      year,
      round
    });

    await ImportLogModel.findOneAndUpdate(
      { fileName, year, round },
      {
        $set: {
          fileName,
          originalName: fileName,
          filePath,
          fileSize,
          year,
          round,
          roundLabel: `Round ${round}`,
          status: "COMPLETED",
          totalRows: result.imported + (result.skipped || 0),
          importedRows: result.imported,
          skippedRows: result.skipped || 0,
          failedRows: result.failedRows.length,
          errors: result.failedRows.map((row) => ({ ...row, timestamp: new Date() })),
          processingTimeMs: Date.now() - startedAt
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`   ✅ Imported: ${result.imported} cutoffs`);
    if (result.skipped) {
      console.log(`   ⚠️ Skipped: ${result.skipped} rows`);
    }

    return result;
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);

    await ImportLogModel.findOneAndUpdate(
      { fileName, year, round },
      {
        $set: {
          fileName,
          originalName: fileName,
          filePath,
          fileSize,
          year,
          round,
          roundLabel: `Round ${round}`,
          status: "FAILED",
          totalRows: 0,
          importedRows: 0,
          skippedRows: 0,
          failedRows: 1,
          processingTimeMs: Date.now() - startedAt,
          errors: [{ line: "", reason: error instanceof Error ? error.message : "Unknown error", timestamp: new Date() }]
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return null;
  }
}

async function importPDFs() {
  try {
    console.log("🚀 Starting KCET PDF Import System\n");

    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Initialize database with categories, branches, colleges
    await initializeDatabase();
    await removeInvalidNumericBranches();

    // Check if uploads directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      console.log(`\n⚠️ Upload directory not found: ${UPLOAD_DIR}`);
      console.log("Creating uploads directory...");
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Find PDF files in uploads directory
    const allPdfFiles = fs.readdirSync(UPLOAD_DIR).filter((file) => file.toLowerCase().endsWith(".pdf"));
    const pdfFiles = selectUniquePdfFiles(allPdfFiles);

    if (pdfFiles.length === 0) {
      console.log("\n⚠️ No PDF files found in uploads directory.");
      console.log(`\n💡 Place KCET cutoff PDFs in: ${UPLOAD_DIR}`);
      console.log("Expected format: '1st Round CutOff 2025.pdf', '2nd Round CutOff 2025.pdf', etc.");
    } else {
      const duplicateCount = allPdfFiles.length - pdfFiles.length;
      console.log(`\n📚 Found ${allPdfFiles.length} PDF files (${pdfFiles.length} unique by year/round/size) to process`);
      if (duplicateCount > 0) {
        console.log(`   Skipping ${duplicateCount} duplicate uploaded copy/copies`);
      }

      let totalImported = 0;
      let totalFailed = 0;

      for (const pdfFile of pdfFiles) {
        const filePath = path.join(UPLOAD_DIR, pdfFile);
        const result = await processPdfFile(filePath);
        if (result) {
          totalImported += result.imported;
        } else {
          totalFailed++;
        }
      }

      console.log(`\n📊 Import Summary:`);
      console.log(`   Total PDFs processed: ${pdfFiles.length}`);
      console.log(`   Total cutoffs imported: ${totalImported}`);
      console.log(`   Failed imports: ${totalFailed}`);
    }

    // Show database statistics
    const collegeCount = await CollegeModel.countDocuments();
    const branchCount = await BranchModel.countDocuments();
    const categoryCount = await CategoryModel.countDocuments();
    const cutoffCount = await CutoffModel.countDocuments();
    const importLogCount = await ImportLogModel.countDocuments();

    console.log(`\n📈 Database Statistics:`);
    console.log(`   Colleges: ${collegeCount}`);
    console.log(`   Branches: ${branchCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Cutoffs: ${cutoffCount}`);
    console.log(`   Import Logs: ${importLogCount}`);

    console.log("\n🎉 PDF import completed successfully!");

  } catch (error) {
    console.error("\n❌ Import failed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
  }
}

// Run if called directly
if (require.main === module) {
  importPDFs().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { importPDFs };
