import mongoose from "mongoose";
import { env } from "../config/env";
import { CategoryModel } from "../models/category.model";
import { BranchModel } from "../models/branch.model";
import { UserModel } from "../models/user.model";
import { KnowledgeBaseModel } from "../models/knowledge-base.model";
import { KCET_CATEGORIES } from "../config/constants";
import bcrypt from "bcryptjs";

const KCET_BRANCHES = [
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
  { code: "PM", name: "Polymer Science" },
  { code: "AR", name: "Architecture" },
  { code: "AG", name: "Agriculture" },
  { code: "HC", name: "Horticulture" },
  { code: "FR", name: "Forestry" },
  { code: "CS", name: "Community Science" },
  { code: "SR", name: "Sericulture" },
  { code: "FT", name: "Food Technology" },
  { code: "DT", name: "Dairy Technology" },
  { code: "FS", name: "Fisheries Science" },
  { code: "VH", name: "Veterinary Science" },
  { code: "AI", name: "Artificial Intelligence" },
  { code: "AI&DS", name: "Artificial Intelligence and Data Science" },
  { code: "AIML", name: "Artificial Intelligence and Machine Learning" },
  { code: "DS", name: "Data Science" },
  { code: "IOT", name: "Internet of Things" },
  { code: "CSM", name: "Computer Science and Engineering (Artificial Intelligence and Machine Learning)" },
  { code: "CSD", name: "Computer Science and Engineering (Data Science)" }
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Seed Categories
    console.log("\n📁 Seeding categories...");
    const categoriesToInsert = KCET_CATEGORIES.map((cat) => ({
      code: cat.code,
      name: cat.name,
      group: cat.group,
      tags: cat.tags || []
    }));

    for (const category of categoriesToInsert) {
      await CategoryModel.findOneAndUpdate(
        { code: category.code },
        category,
        { upsert: true, new: true }
      );
    }
    const categoryCount = await CategoryModel.countDocuments();
    console.log(`✅ Seeded ${categoryCount} categories`);

    // 2. Seed Branches
    console.log("\n📁 Seeding branches...");
    for (const branch of KCET_BRANCHES) {
      await BranchModel.findOneAndUpdate(
        { code: branch.code },
        branch,
        { upsert: true, new: true }
      );
    }
    const branchCount = await BranchModel.countDocuments();
    console.log(`✅ Seeded ${branchCount} branches`);

    // 3. Create/update default admin user
    console.log("\n📁 Creating/updating admin user...");
    const adminPasswordHash = await bcrypt.hash("Samra005", 12);
    const existingAdmin = await UserModel.findOneAndUpdate(
      { email: "mafshaan1705@gmail.com" },
      {
        $set: {
          name: "Admin",
          email: "mafshaan1705@gmail.com",
          passwordHash: adminPasswordHash,
          role: "ADMIN"
        }
      },
      { upsert: true, new: true }
    );
    console.log("✅ Admin user ready (email: mafshaan1705@gmail.com, password: Samra005)");

    // 5. Create demo student user
    console.log("\n📁 Creating demo student user...");
    const existingStudent = await UserModel.findOne({ email: "student@demo.com" });
    if (!existingStudent) {
      const passwordHash = await bcrypt.hash("student123", 12);
      await UserModel.create({
        name: "Demo Student",
        email: "student@demo.com",
        passwordHash,
        role: "STUDENT"
      });
      console.log("✅ Created student user (email: student@demo.com, password: student123)");
    } else {
      console.log("ℹ️ Student user already exists");
    }

    // 6. Seed Knowledge Base
    console.log("\n📁 Seeding knowledge base for SAM...");
    const SEED_KNOWLEDGE = [
      // Counselling Tips
      { category: "counselling_tip", title: "Document Deadline", content: "Keep all original documents ready before counselling: KCET scorecard, 10th & 12th marks cards, caste certificate (if applicable), income certificate, and study certificates. Missing documents at document verification can lead to seat cancellation.", tags: ["documents", "deadline", "verification"], priority: 8 },
      { category: "counselling_tip", title: "Option Entry Strategy", content: "During option entry, always fill ALL colleges you would be willing to attend, in order of genuine preference. Do not leave gaps hoping for a better college later — KEA's system will allot the highest preference available to you. Listing more options never hurts your chances.", tags: ["option-entry", "strategy", "preference"], priority: 10 },
      { category: "counselling_tip", title: "Category Certificate Validity", content: "Ensure your category certificate is issued by a competent authority within the last 12 months. KEA is strict about certificate validity. If your certificate is expired, get a new one before document verification.", tags: ["category", "certificate", "reservation"], priority: 7 },
      { category: "counselling_tip", title: "Round 2 Upgrade", content: "If you are allotted a seat in Round 1 and want an upgrade, you MUST exercise the 'Upgrade' option. If you do nothing, you will retain your Round 1 seat. If you 'Exit', you lose all chances. Only choose 'Exit' if you are absolutely sure you do not want any KEA seat.", tags: ["round-2", "upgrade", "exit"], priority: 9 },
      { category: "counselling_tip", title: "Payment and Reporting", content: "After seat allotment, pay the acceptance fee within the deadline (usually 2-3 days) and report to the allotted college. Failure to pay or report = forfeiture of seat. KEA does not issue refunds once fee is paid.", tags: ["payment", "reporting", "fee"], priority: 8 },

      // Placement Insights
      { category: "placement_insight", title: "Top Placement Colleges", content: "RV College of Engineering, BMS College of Engineering, and PES University (RR Campus) consistently report the highest average packages in KCET. RVCE's CSE branch averages ₹28-32 LPA, while BMS CE's CSE averages ₹22-26 LPA. Consider these if placement is your primary criterion.", tags: ["placement", "top-colleges", "rvce", "bmsce", "pes"], priority: 10 },
      { category: "placement_insight", title: "CSE vs ECE Placements", content: "While CSE graduates have the widest range of placement opportunities (tech roles), ECE graduates are seeing rising demand in semiconductor, telecom, and embedded systems sectors. Companies like Qualcomm, Texas Instruments, Intel, and Samsung hire ECE in large numbers. ECE placement rates at top colleges are nearly on par with CSE.", tags: ["cse", "ece", "comparison", "placement"], priority: 7 },
      { category: "placement_insight", title: "Average vs Highest Package", content: "Do not make decisions based solely on the highest package — it is often a single outlier. Look at the average package and placement rate instead. A college with ₹12 LPA average and 95% placement rate is generally better than one with ₹18 LPA average but only 60% placement.", tags: ["package", "average", "highest", "metrics"], priority: 8 },

      // Branch Advice
      { category: "branch_advice", title: "CSE Core vs AI/ML Specialization", content: "CSE Core gives you the broadest foundation and keeps all tech career paths open (software engineering, AI/ML, data science, systems, cybersecurity). AI/ML specializations like AIML, CSM, AI&DS are excellent if you are certain about pursuing AI/ML, but CSE Core students can also transition into AI roles with electives and projects.", tags: ["cse", "aiml", "specialization", "career"], priority: 9 },
      { category: "branch_advice", title: "ECE vs EEE vs Mechanical", content: "ECE offers the best placement-to-effort ratio among non-CSE branches. EEE is excellent for core electrical jobs and PSU exams but has fewer direct tech placements. Mechanical has strong demand in manufacturing, automotive, and aerospace sectors but lower average packages compared to IT branches.", tags: ["ece", "eee", "mechanical", "comparison"], priority: 7 },
      { category: "branch_advice", title: "Choosing Between Colleges and Branches", content: "General rule: prefer a lower branch at a top college over a top branch at a lower college (e.g., ECE at RVCE > CSE at a lesser-known college). The college brand, alumni network, and placement ecosystem matter more than the branch name for most careers. Exceptions: if you have a strong, specific interest (e.g., core AI research), prioritize the branch.", tags: ["college-vs-branch", "strategy", "decision"], priority: 10 },

      // District Info
      { category: "district_info", title: "Bangalore Colleges", content: "Bangalore has the highest concentration of top KCET colleges. Key colleges: RVCE, BMS CE, PES University, Dayananda Sagar University, Ramaiah IIT, SJBIT, and New Horizon College of Engineering. Bangalore also has the highest cutoff ranges — expect ranks 500-15000 for top CSE seats.", tags: ["bangalore", "top-colleges", "urban"], priority: 6 },
      { category: "district_info", title: "Mysore Colleges", content: "Mysore has excellent colleges like NIE Mysore, VVCE, and SJCE. Cutoffs are moderately lower than Bangalore for equivalent branches. NIE CSE typically closes around rank 8000-18000 depending on category. Mysore is a great option if you want quality education without Bangalore's high living costs.", tags: ["mysore", "nie", "vvce", "sjce"], priority: 5 },
      { category: "district_info", title: "Hubli-Dharwad Colleges", content: "Hubli-Dharwad region features SDM College of Engineering, BVB Hubli, and KLE Tech. BVB (B.V. Bhoomaraddi) has the strongest reputation in this region with CSE closing around rank 12000-25000. Lower competition than Bangalore but still solid placement records.", tags: ["hubli", "dharwad", "bvb", "kletech"], priority: 5 },

      // Strategy
      { category: "strategy", title: "Rank Based Strategy < 5000", content: "If your rank is under 5000, you have excellent options. Dream: RVCE CSE/ECE, BMS CE CSE. Competitive: PES CSE, Ramaiah CSE, RVCE EEE/ME. Strategy: Focus on branch preference at the top 5-6 colleges. Use option entry to order by genuine preference. Round 2 upgrades are unlikely to benefit you much since you already have top choices.", tags: ["top-rank", "dream", "rvce", "strategy"], priority: 10 },
      { category: "strategy", title: "Rank Based Strategy 5000-15000", content: "With rank 5000-15000, you can get good CSE at colleges like Dayananda Sagar, SJBIT, New Horizon, and top branches (ECE, ISE) at RVCE/BMS if you have category benefit. Dream: ISE/ECE at top-3 colleges. Competitive: CSE at good colleges. Moderate: Top branches at lesser-known colleges. Safe: Core branches at decent colleges.", tags: ["mid-rank", "strategy", "dream", "moderate"], priority: 9 },
      { category: "strategy", title: "Rank Based Strategy 15000-50000", content: "Rank 15000-50000 requires a balanced approach. Focus on: ECE, ISE, ME, EEE at good colleges rather than fighting for CSE at lower-tier colleges. Branch reputation matters less than college placement ecosystem at this range. Consider colleges outside Bangalore (Mysore, Hubli, Mangalore) for better value at this rank.", tags: ["lower-rank", "strategy", "tier-2"], priority: 8 },
      { category: "strategy", title: "Rank Based Strategy > 50000", content: "For ranks above 50000, prioritize getting admission into a decent college over branch preference. Mechanical, Civil, EEE at mid-tier colleges are realistic. Consider: local colleges near your hometown for lower fees, colleges with good industry connections, and branches with lower cutoffs but decent demand. Lateral entry through diploma or PG is also an option later.", tags: ["low-rank", "backup", "strategy"], priority: 7 },

      // FAQ
      { category: "faq", title: "Can I change my category after option entry?", content: "No, your category is locked at the time of application/registration. You cannot change it during or after option entry. Verify your category before the application deadline.", tags: ["category", "change", "locked"], priority: 6 },
      { category: "faq", title: "What if I miss Round 1 allotment?", content: "If you miss Round 1 (did not get a seat), you are automatically considered for Round 2. You do not need to re-enter options in most cases. However, you can modify options before the Round 2 deadline. Missing Round 2 means you go to Round 3 (extended round).", tags: ["round-1", "missed", "allotment"], priority: 8 },
      { category: "faq", title: "Is management quota better than KCET?", content: "Management quota seats are significantly more expensive (2-5x tuition) and may have different placement support. KCET seats are always preferable for cost and transparency. Only consider management quota if you absolutely cannot get a desired branch through KCET and can afford the fees.", tags: ["management", "quota", "fee", "comparison"], priority: 7 },
      { category: "faq", title: "Can college predict cutoff trends?", content: "Cutoffs fluctuate year-to-year based on factors: number of applicants, exam difficulty, seat availability, category distribution, and college reputation trends. Use historical data (last 2-3 years) as reference, not guarantee. Allow ±3000 rank buffer for safe predictions.", tags: ["cutoff", "trend", "prediction", "accuracy"], priority: 6 },

      // System Prompt (critical — instructs SAM's behavior)
      { category: "system_prompt", title: "SAM Core Identity", content: "You are SAM, an AI KCET admission counsellor powered by ValidatorAI. Your personality is friendly, encouraging, and data-driven. Use emojis sparingly. Always give advice backed by cutoff data, placement statistics, or KCET counselling rules when possible. If a user seems anxious, reassure them. If they seem confused, simplify your explanation. Never make up cutoff numbers — use the data provided in context. If you don't know something, say so honestly. Your goal is to help students make informed admission decisions.", tags: ["identity", "personality", "rules"], priority: 100, isActive: true },
      { category: "system_prompt", title: "SAM Response Format", content: "Structure responses in this order: 1) Direct answer to user's question (1-2 sentences), 2) Supporting reasoning with data/context, 3) Specific actionable advice. Use short paragraphs (2-3 sentences max). Separate sections with line breaks. When listing colleges or options, use numbered lists. When showing data comparisons, use simple markdown tables. Always end with an offer to help further.", tags: ["format", "structure", "response"], priority: 90, isActive: true },
    ];

    const adminUser = await UserModel.findOne({ email: "mafshaan1705@gmail.com" });
    const adminId = adminUser?._id;

    for (const entry of SEED_KNOWLEDGE) {
      const existing = await KnowledgeBaseModel.findOne({ title: entry.title, category: entry.category });
      if (!existing) {
        await KnowledgeBaseModel.create({ ...entry, createdBy: adminId });
        console.log(`   + Created: [${entry.category}] ${entry.title}`);
      } else {
        console.log(`   = Skipped (exists): ${entry.title}`);
      }
    }
    const kbCount = await KnowledgeBaseModel.countDocuments();
    console.log(`✅ Seeded ${kbCount} knowledge base entries`);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Branches: ${branchCount}`);
    console.log(`   Users: ${await UserModel.countDocuments()} (admin + students)`);
    console.log(`   Knowledge Base: ${kbCount} entries`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { seedDatabase };
