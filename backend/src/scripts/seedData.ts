import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kcet';

// Schemas
const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  city: { type: String, required: true },
  state: { type: String, default: 'Karnataka' },
  type: { type: String, enum: ['Government', 'Private', 'Autonomous'], required: true },
  tier: { type: Number, enum: [1, 2, 3], default: 2 },
  placements: {
    averagePackage: Number,
    highestPackage: Number,
    placementRate: Number
  },
  branches: [{ type: String }]
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: String
}, { timestamps: true });

const cutoffSchema = new mongoose.Schema({
  collegeCode: { type: String, required: true },
  collegeName: { type: String, required: true },
  branchCode: { type: String, required: true },
  branchName: { type: String, required: true },
  category: { type: String, required: true },
  round: { type: Number, required: true },
  year: { type: Number, required: true },
  openingRank: { type: Number, required: true },
  closingRank: { type: Number, required: true },
  quota: { type: String, enum: ['State', 'All India', 'NRI', 'OCI'], default: 'State' },
  gender: { type: String, enum: ['Male', 'Female', 'Both'], default: 'Both' },
  homeRegion: String
}, { timestamps: true });

const importLogSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  round: { type: Number, required: true },
  year: { type: Number, required: true },
  status: { type: String, enum: ['success', 'partial', 'failed'], required: true },
  totalRows: { type: Number, required: true },
  insertedRows: { type: Number, required: true },
  skippedRows: { type: Number, required: true },
  errors: [{ type: String }],
  importedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create models
const College = mongoose.models.College || mongoose.model('College', collegeSchema);
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
const Cutoff = mongoose.models.Cutoff || mongoose.model('Cutoff', cutoffSchema);
const ImportLog = mongoose.models.ImportLog || mongoose.model('ImportLog', importLogSchema);

// Standard categories for KCET
const STANDARD_CATEGORIES = [
  { name: 'General Merit', code: 'GM' },
  { name: 'General Merit Kannada Medium', code: 'GMK' },
  { name: 'General Merit Rural', code: 'GMR' },
  { name: 'General Merit EWS', code: 'GMP' },
  { name: '1st Category General', code: '1G' },
  { name: '2A Category General', code: '2AG' },
  { name: '2B Category General', code: '2BG' },
  { name: '3A Category General', code: '3AG' },
  { name: '3B Category General', code: '3BG' },
  { name: 'SC General', code: 'SCG' },
  { name: 'SC Kannada Medium', code: 'SCK' },
  { name: 'SC Rural', code: 'SCR' },
  { name: 'ST General', code: 'STG' },
  { name: 'ST Kannada Medium', code: 'STK' },
  { name: 'ST Rural', code: 'STR' },
  { name: 'Rural', code: 'RURAL' },
  { name: 'Kannada Medium', code: 'KM' },
  { name: 'Hyderabad Karnataka', code: 'HK' }
];

// Comprehensive college data
const COLLEGES = [
  { code: '100', name: 'University B.D.T. College of Engineering, Davanagere', city: 'Davanagere', type: 'Autonomous', tier: 1 },
  { code: '101', name: 'Basavakalyana Engineering College, Basavakalyana', city: 'Basavakalyana', type: 'Government', tier: 2 },
  { code: '102', name: 'Government Engineering College, Raichur', city: 'Raichur', type: 'Government', tier: 2 },
  { code: '103', name: 'Government Engineering College, Karwar', city: 'Karwar', type: 'Government', tier: 2 },
  { code: '104', name: 'Government Engineering College, K.R.Pete', city: 'K.R.Pete', type: 'Government', tier: 2 },
  { code: '105', name: 'Government Engineering College, Hassan', city: 'Hassan', type: 'Government', tier: 2 },
  { code: '106', name: 'University Visvesvaraya College of Engineering, Bangalore', city: 'Bangalore', type: 'Government', tier: 1 },
  { code: '107', name: 'B.M.S. College of Engineering, Bangalore', city: 'Bangalore', type: 'Autonomous', tier: 1 },
  { code: '108', name: 'Bangalore Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 1 },
  { code: '109', name: 'Dayananda Sagar College of Engineering, Bangalore', city: 'Bangalore', type: 'Private', tier: 1 },
  { code: '110', name: 'R.V. College of Engineering, Bangalore', city: 'Bangalore', type: 'Autonomous', tier: 1 },
  { code: '111', name: 'M.S. Ramaiah Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 1 },
  { code: '112', name: 'Siddaganga Institute of Technology, Tumkur', city: 'Tumkur', type: 'Private', tier: 1 },
  { code: '113', name: 'Sri Jayachamarajendra College of Engineering, Mysore', city: 'Mysore', type: 'Government', tier: 1 },
  { code: '114', name: 'National Institute of Engineering, Mysore', city: 'Mysore', type: 'Private', tier: 1 },
  { code: '115', name: 'Malnad College of Engineering, Hassan', city: 'Hassan', type: 'Government', tier: 1 },
  { code: '116', name: 'Shri Madhwa Vadiraja Institute of Technology, Udupi', city: 'Udupi', type: 'Private', tier: 2 },
  { code: '117', name: 'Manipal Institute of Technology, Manipal', city: 'Manipal', type: 'Private', tier: 1 },
  { code: '118', name: 'Dr. Ambedkar Institute of Technology, Bangalore', city: 'Bangalore', type: 'Government', tier: 2 },
  { code: '119', name: 'C.M.R. Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  { code: '120', name: 'Acharya Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  { code: '121', name: 'B.N.M. Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  { code: '122', name: 'J.S.S. Academy of Technical Education, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  { code: '123', name: 'Jain Institute of Technology, Davanagere', city: 'Davanagere', type: 'Private', tier: 2 },
  { code: '124', name: 'K.L.E. Society\'s College of Engineering and Technology, Dharwad', city: 'Dharwad', type: 'Private', tier: 2 },
  { code: '125', name: 'K.L.E. Institute of Technology, Hubballi', city: 'Hubballi', type: 'Private', tier: 2 },
  { code: '126', name: 'Maratha Mandal Engineering College, Belagavi', city: 'Belagavi', type: 'Private', tier: 2 },
  { code: '127', name: 'P.A. College of Engineering, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  { code: '128', name: 'P.E.S. College of Engineering, Mandya', city: 'Mandya', type: 'Private', tier: 2 },
  { code: '129', name: 'P.E.S. Institute of Technology and Management, Shivamogga', city: 'Shivamogga', type: 'Private', tier: 2 },
  { code: '130', name: 'P.E.S. University, Bangalore', city: 'Bangalore', type: 'Private', tier: 1 },
  { code: '131', name: 'R.N.S. Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  { code: '132', name: 'T.John Engineering College, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  { code: '133', name: 'Vemana Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  { code: '134', name: 'G.M. Institute of Technology, Raichur', city: 'Raichur', type: 'Private', tier: 2 },
  { code: '135', name: 'H.M.S. Institute of Technology, Tumkur', city: 'Tumkur', type: 'Private', tier: 2 },
  { code: '136', name: 'S.J.C. Institute of Technology, Chickballapur', city: 'Chickballapur', type: 'Private', tier: 2 },
  { code: '137', name: 'R.L. Jalappa Institute of Technology, Kolar', city: 'Kolar', type: 'Private', tier: 2 },
  { code: '138', name: 'S.V. Institute of Technology, Kolar', city: 'Kolar', type: 'Private', tier: 3 },
  { code: '139', name: 'East West Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  { code: '140', name: 'Ghousia College of Engineering, Ramanagara', city: 'Ramanagara', type: 'Private', tier: 3 },
  { code: '141', name: 'St. Joseph Engineering College, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  { code: '142', name: 'Canara Engineering College, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  { code: '143', name: 'Srinivas Institute of Technology, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  { code: '144', name: 'Yenepoya Institute of Technology, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  { code: '145', name: 'Alva\'s Institute of Engineering and Technology, Moodbidri', city: 'Moodbidri', type: 'Private', tier: 2 },
  { code: '146', name: 'K.V. Institute of Management Studies and Research, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  { code: '147', name: 'Vivekananda College of Engineering and Technology, Puttur', city: 'Puttur', type: 'Private', tier: 2 },
  { code: '148', name: 'P.A. College of Engineering, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  { code: '149', name: 'S.E.A. College of Engineering and Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 3 },
  { code: '150', name: 'K.S. School of Engineering and Management, Bangalore', city: 'Bangalore', type: 'Private', tier: 3 }
];

// Branch data
const BRANCHES = [
  { code: 'CS', name: 'Computer Science and Engineering' },
  { code: 'EC', name: 'Electronics and Communication Engineering' },
  { code: 'EE', name: 'Electrical and Electronics Engineering' },
  { code: 'ME', name: 'Mechanical Engineering' },
  { code: 'CV', name: 'Civil Engineering' },
  { code: 'IS', name: 'Information Science and Engineering' },
  { code: 'TC', name: 'Telecommunication Engineering' },
  { code: 'IN', name: 'Instrumentation Technology' },
  { code: 'IE', name: 'Industrial Engineering and Management' },
  { code: 'AU', name: 'Automobile Engineering' },
  { code: 'AE', name: 'Aeronautical Engineering' },
  { code: 'BT', name: 'Biotechnology' },
  { code: 'ML', name: 'Medical Electronics' },
  { code: 'BM', name: 'Biomedical Engineering' },
  { code: 'CH', name: 'Chemical Engineering' },
  { code: 'EV', name: 'Environmental Engineering' },
  { code: 'MT', name: 'Metallurgical Engineering' },
  { code: 'MN', name: 'Mining Engineering' },
  { code: 'TX', name: 'Textile Technology' },
  { code: 'AR', name: 'Architecture' }
];

// Generate realistic cutoff data
function generateCutoffs() {
  const cutoffs = [];
  const years = [2023, 2024, 2025];
  const rounds = [1, 2, 3];
  
  for (const college of COLLEGES) {
    const collegeTier = college.tier;
    const branchesForCollege = collegeTier === 1 ? 8 : collegeTier === 2 ? 5 : 3;
    const selectedBranches = BRANCHES.slice(0, branchesForCollege);
    
    for (const branch of selectedBranches) {
      for (const year of years) {
        for (const round of rounds) {
          for (const category of STANDARD_CATEGORIES) {
            let baseRank: number;
            
            if (collegeTier === 1) {
              baseRank = 1000 + Math.floor(Math.random() * 5000);
            } else if (collegeTier === 2) {
              baseRank = 5000 + Math.floor(Math.random() * 10000);
            } else {
              baseRank = 15000 + Math.floor(Math.random() * 20000);
            }
            
            if (branch.code === 'CS' || branch.code === 'IS') {
              baseRank = Math.floor(baseRank * 0.7);
            } else if (branch.code === 'EC' || branch.code === 'EE') {
              baseRank = Math.floor(baseRank * 0.85);
            }
            
            if (['GM', 'GMK', 'GMR', 'GMP'].includes(category.code)) {
              baseRank = Math.floor(baseRank * 0.8);
            } else if (['SCG', 'SCK', 'SCR'].includes(category.code)) {
              baseRank = Math.floor(baseRank * 1.5);
            } else if (['STG', 'STK', 'STR'].includes(category.code)) {
              baseRank = Math.floor(baseRank * 2);
            } else {
              baseRank = Math.floor(baseRank * 1.3);
            }
            
            const roundMultiplier = 1 + (round - 1) * 0.05;
            const closingRank = Math.floor(baseRank * roundMultiplier);
            const openingRank = Math.max(1, closingRank - Math.floor(Math.random() * 500) - 100);
            
            cutoffs.push({
              collegeCode: college.code,
              collegeName: college.name,
              branchCode: branch.code,
              branchName: branch.name,
              category: category.code,
              round,
              year,
              openingRank,
              closingRank,
              quota: 'State',
              gender: 'Both'
            });
          }
        }
      }
    }
  }
  
  return cutoffs;
}

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await College.deleteMany({});
    await Category.deleteMany({});
    await Cutoff.deleteMany({});
    await ImportLog.deleteMany({});
    console.log('Cleared existing data');
    
    await Category.insertMany(STANDARD_CATEGORIES);
    console.log(`Inserted ${STANDARD_CATEGORIES.length} categories`);
    
    const collegesToInsert = COLLEGES.map(college => ({
      ...college,
      branches: BRANCHES.slice(0, college.tier === 1 ? 8 : college.tier === 2 ? 5 : 3).map(b => b.name)
    }));
    await College.insertMany(collegesToInsert);
    console.log(`Inserted ${collegesToInsert.length} colleges`);
    
    const cutoffs = generateCutoffs();
    const BATCH_SIZE = 1000;
    for (let i = 0; i < cutoffs.length; i += BATCH_SIZE) {
      const batch = cutoffs.slice(i, i + BATCH_SIZE);
      await Cutoff.insertMany(batch, { ordered: false });
      console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} cutoffs)`);
    }
    console.log(`Inserted ${cutoffs.length} cutoff records`);
    
    await ImportLog.create({
      fileName: 'seed_data',
      round: 0,
      year: 2025,
      status: 'success',
      totalRows: cutoffs.length,
      insertedRows: cutoffs.length,
      skippedRows: 0,
      errors: []
    });
    
    const collegeCount = await College.countDocuments();
    const categoryCount = await Category.countDocuments();
    const cutoffCount = await Cutoff.countDocuments();
    const importLogCount = await ImportLog.countDocuments();
    
    console.log('\n=== Database Summary ===');
    console.log(`Colleges: ${collegeCount}`);
    console.log(`Categories: ${categoryCount}`);
    console.log(`Cutoffs: ${cutoffCount}`);
    console.log(`Import Logs: ${importLogCount}`);
    console.log('========================\n');
    
    return {
      colleges: collegeCount,
      categories: categoryCount,
      cutoffs: cutoffCount,
      importLogs: importLogCount
    };
    
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Export for use in routes
export { seedData };

// Run if called directly
if (require.main === module) {
  seedData().catch(console.error);
}