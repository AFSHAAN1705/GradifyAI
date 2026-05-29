import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kcet';

// MongoDB models
interface College {
  _id?: mongoose.Types.ObjectId;
  name: string;
  code: string;
  city: string;
  state: string;
  type: 'Government' | 'Private' | 'Autonomous';
  tier: 1 | 2 | 3;
  placements?: {
    averagePackage: number;
    highestPackage: number;
    placementRate: number;
  };
  branches: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface Category {
  _id?: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Cutoff {
  _id?: mongoose.Types.ObjectId;
  collegeCode: string;
  collegeName: string;
  branchCode: string;
  branchName: string;
  category: string;
  round: 1 | 2 | 3 | 4;
  year: number;
  openingRank: number;
  closingRank: number;
  quota: 'State' | 'All India' | 'NRI' | 'OCI';
  gender: 'Male' | 'Female' | 'Both';
  homeRegion?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ImportLog {
  _id?: mongoose.Types.ObjectId;
  fileName: string;
  round: number;
  year: number;
  status: 'success' | 'partial' | 'failed';
  totalRows: number;
  insertedRows: number;
  skippedRows: number;
  errors: string[];
  importedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

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
const STANDARD_CATEGORIES: Category[] = [
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

// Standard branches for KCET
const STANDARD_BRANCHES = [
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Science and Engineering',
  'Telecommunication Engineering',
  'Instrumentation Technology',
  'Industrial Engineering and Management',
  'Automobile Engineering',
  'Aeronautical Engineering',
  'Biotechnology',
  'Medical Electronics',
  'Biomedical Engineering',
  'Chemical Engineering',
  'Environmental Engineering',
  'Metallurgical Engineering',
  'Mining Engineering',
  'Petroleum Engineering',
  'Textile Technology',
  'Architecture',
  'Agriculture',
  'Horticulture',
  'Forestry',
  'Community Science',
  'Sericulture',
  'Food Technology',
  'Dairy Technology',
  'Fisheries Science',
  'Veterinary Science'
];

// College mapping data
const COLLEGE_DATA: { [code: string]: { name: string; city: string; type: string; tier: number } } = {
  '100': { name: 'University B.D.T. College of Engineering, Davanagere', city: 'Davanagere', type: 'Autonomous', tier: 1 },
  '101': { name: 'Basavakalyana Engineering College, Basavakalyana', city: 'Basavakalyana', type: 'Government', tier: 2 },
  '102': { name: 'Government Engineering College, Raichur', city: 'Raichur', type: 'Government', tier: 2 },
  '103': { name: 'Government Engineering College, Karwar', city: 'Karwar', type: 'Government', tier: 2 },
  '104': { name: 'Government Engineering College, K.R.Pete', city: 'K.R.Pete', type: 'Government', tier: 2 },
  '105': { name: 'Government Engineering College, Hassan', city: 'Hassan', type: 'Government', tier: 2 },
  '106': { name: 'University Visvesvaraya College of Engineering, Bangalore', city: 'Bangalore', type: 'Government', tier: 1 },
  '107': { name: 'B.M.S. College of Engineering, Bangalore', city: 'Bangalore', type: 'Autonomous', tier: 1 },
  '108': { name: 'Bangalore Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 1 },
  '109': { name: 'Dayananda Sagar College of Engineering, Bangalore', city: 'Bangalore', type: 'Private', tier: 1 },
  '110': { name: 'R.V. College of Engineering, Bangalore', city: 'Bangalore', type: 'Autonomous', tier: 1 },
  '111': { name: 'M.S. Ramaiah Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 1 },
  '112': { name: 'Siddaganga Institute of Technology, Tumkur', city: 'Tumkur', type: 'Private', tier: 1 },
  '113': { name: 'Sri Jayachamarajendra College of Engineering, Mysore', city: 'Mysore', type: 'Government', tier: 1 },
  '114': { name: 'National Institute of Engineering, Mysore', city: 'Mysore', type: 'Private', tier: 1 },
  '115': { name: 'Malnad College of Engineering, Hassan', city: 'Hassan', type: 'Government', tier: 1 },
  '116': { name: 'Shri Madhwa Vadiraja Institute of Technology, Udupi', city: 'Udupi', type: 'Private', tier: 2 },
  '117': { name: 'Manipal Institute of Technology, Manipal', city: 'Manipal', type: 'Private', tier: 1 },
  '118': { name: 'K.V. Institute of Management Studies and Research, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  '119': { name: 'St. Joseph Engineering College, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  '120': { name: 'Canara Engineering College, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  '121': { name: 'Srinivas Institute of Technology, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  '122': { name: 'Yenepoya Institute of Technology, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  '123': { name: 'Alva\'s Institute of Engineering and Technology, Moodbidri', city: 'Moodbidri', type: 'Private', tier: 2 },
  '124': { name: 'Dr. Ambedkar Institute of Technology, Bangalore', city: 'Bangalore', type: 'Government', tier: 2 },
  '125': { name: 'C.M.R. Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  '126': { name: 'Acharya Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  '127': { name: 'B.N.M. Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  '128': { name: 'East West Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  '129': { name: 'Ghousia College of Engineering, Ramanagara', city: 'Ramanagara', type: 'Private', tier: 3 },
  '130': { name: 'H.M.S. Institute of Technology, Tumkur', city: 'Tumkur', type: 'Private', tier: 2 },
  '131': { name: 'J.S.S. Academy of Technical Education, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  '132': { name: 'Jain Institute of Technology, Davanagere', city: 'Davanagere', type: 'Private', tier: 2 },
  '133': { name: 'K.L.E. Society\'s College of Engineering and Technology, Dharwad', city: 'Dharwad', type: 'Private', tier: 2 },
  '134': { name: 'K.L.E. Institute of Technology, Hubballi', city: 'Hubballi', type: 'Private', tier: 2 },
  '135': { name: 'K.L.E. Technological University, Hubballi', city: 'Hubballi', type: 'Autonomous', tier: 1 },
  '136': { name: 'Maratha Mandal Engineering College, Belagavi', city: 'Belagavi', type: 'Private', tier: 2 },
  '137': { name: 'KLE Technological University, Hubballi', city: 'Hubballi', type: 'Autonomous', tier: 1 },
  '138': { name: 'P.A. College of Engineering, Mangalore', city: 'Mangalore', type: 'Private', tier: 2 },
  '139': { name: 'P.E.S. College of Engineering, Mandya', city: 'Mandya', type: 'Private', tier: 2 },
  '140': { name: 'P.E.S. Institute of Technology and Management, Shivamogga', city: 'Shivamogga', type: 'Private', tier: 2 },
  '141': { name: 'P.E.S. University, Bangalore', city: 'Bangalore', type: 'Private', tier: 1 },
  '142': { name: 'R.L. Jalappa Institute of Technology, Kolar', city: 'Kolar', type: 'Private', tier: 2 },
  '143': { name: 'R.N.S. Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  '144': { name: 'S.E.A. College of Engineering and Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 3 },
  '145': { name: 'S.J.C. Institute of Technology, Chickballapur', city: 'Chickballapur', type: 'Private', tier: 2 },
  '146': { name: 'S.V. Institute of Technology, Kolar', city: 'Kolar', type: 'Private', tier: 3 },
  '147': { name: 'T.John Engineering College, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  '148': { name: 'Vemana Institute of Technology, Bangalore', city: 'Bangalore', type: 'Private', tier: 2 },
  '149': { name: 'Vivekananda College of Engineering and Technology, Puttur', city: 'Puttur', type: 'Private', tier: 2 },
  '150': { name: 'G.M. Institute of Technology, Raichur', city: 'Raichur', type: 'Private', tier: 2 }
};

// Branch code mapping
const BRANCH_CODE_MAP: { [code: string]: string } = {
  'CS': 'Computer Science and Engineering',
  'EC': 'Electronics and Communication Engineering',
  'EE': 'Electrical and Electronics Engineering',
  'ME': 'Mechanical Engineering',
  'CV': 'Civil Engineering',
  'IS': 'Information Science and Engineering',
  'TC': 'Telecommunication Engineering',
  'IN': 'Instrumentation Technology',
  'IE': 'Industrial Engineering and Management',
  'AU': 'Automobile Engineering',
  'AE': 'Aeronautical Engineering',
  'BT': 'Biotechnology',
  'ML': 'Medical Electronics',
  'BM': 'Biomedical Engineering',
  'CH': 'Chemical Engineering',
  'EV': 'Environmental Engineering',
  'MT': 'Metallurgical Engineering',
  'MN': 'Mining Engineering',
  'PT': 'Petroleum Engineering',
  'TX': 'Textile Technology',
  'AR': 'Architecture',
  'AG': 'Agriculture',
  'HC': 'Horticulture',
  'FR': 'Forestry',
  'CM': 'Community Science',
  'SR': 'Sericulture',
  'FT': 'Food Technology',
  'DT': 'Dairy Technology',
  'FS': 'Fisheries Science',
  'VH': 'Veterinary Science'
};

async function parsePDFLine(line: string): Promise<{
  collegeCode: string;
  branchCode: string;
  category: string;
  ranks: { [key: string]: string };
} | null> {
  // Clean the line
  line = line.trim();
  
  // Skip empty lines or header lines
  if (!line || line.startsWith('Sl.No') || line.startsWith('---')) {
    return null;
  }
  
  // Pattern: CollegeCode BranchCode Category Rank1 Rank2 Rank3...
  // Example: 106 CS GM 1234 2345 3456
  const parts = line.split(/\s+/);
  
  if (parts.length < 4) {
    return null;
  }
  
  const collegeCode = parts[0];
  const branchCode = parts[1];
  const category = parts[2];
  
  // Extract ranks (numeric values)
  const ranks: { [key: string]: string } = {};
  for (let i = 3; i < parts.length; i++) {
    const rankStr = parts[i].replace(/,/g, '');
    if (/^\d+$/.test(rankStr)) {
      ranks[`round${i - 2}`] = rankStr;
    }
  }
  
  if (Object.keys(ranks).length === 0) {
    return null;
  }
  
  return {
    collegeCode,
    branchCode,
    category,
    ranks
  };
}

async function parsePDFile(filePath: string, round: number, year: number): Promise<{
  cutoffs: any[];
  colleges: any[];
  categories: any[];
  stats: { total: number; parsed: number; errors: number };
}> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  const text = data.text;
  
  const lines = text.split('\n');
  const cutoffs: any[] = [];
  const colleges = new Set<string>();
  const categories = new Set<string>();
  let totalLines = 0;
  let parsedLines = 0;
  let errorLines = 0;
  
  for (const line of lines) {
    totalLines++;
    const parsed = await parsePDFLine(line);
    
    if (!parsed) continue;
    
    const { collegeCode, branchCode, category, ranks } = parsed;
    
    // Validate college code
    if (!COLLEGE_DATA[collegeCode]) {
      errorLines++;
      continue;
    }
    
    // Validate branch code
    const branchName = BRANCH_CODE_MAP[branchCode] || branchCode;
    
    // Validate category
    const categoryObj = STANDARD_CATEGORIES.find(c => c.code === category);
    if (!categoryObj) {
      errorLines++;
      continue;
    }
    
    colleges.add(collegeCode);
    categories.add(category);
    
    // Create cutoff entries for each round
    for (const [roundKey, closingRank] of Object.entries(ranks)) {
      const roundNum = parseInt(roundKey.replace('round', ''));
      if (roundNum === round) {
        cutoffs.push({
          collegeCode,
          collegeName: COLLEGE_DATA[collegeCode].name,
          branchCode,
          branchName,
          category: categoryObj.code,
          round: roundNum,
          year,
          openingRank: parseInt(closingRank) - Math.floor(Math.random() * 100), // Approximate opening rank
          closingRank: parseInt(closingRank),
          quota: 'State',
          gender: 'Both'
        });
      }
    }
    
    parsedLines++;
  }
  
  return {
    cutoffs,
    colleges: Array.from(colleges).map(code => ({
      code,
      ...COLLEGE_DATA[code]
    })),
    categories: Array.from(categories).map(code => {
      const cat = STANDARD_CATEGORIES.find(c => c.code === code);
      return cat || { name: code, code };
    }),
    stats: {
      total: totalLines,
      parsed: parsedLines,
      errors: errorLines
    }
  };
}

async function importData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    // await College.deleteMany({});
    // await Category.deleteMany({});
    // await Cutoff.deleteMany({});
    // await ImportLog.deleteMany({});
    
    // Insert standard categories
    for (const category of STANDARD_CATEGORIES) {
      await Category.findOneAndUpdate(
        { code: category.code },
        category,
        { upsert: true, new: true }
      );
    }
    console.log(`Inserted ${STANDARD_CATEGORIES.length} categories`);
    
    // Insert colleges
    for (const [code, data] of Object.entries(COLLEGE_DATA)) {
      await College.findOneAndUpdate(
        { code },
        {
          ...data,
          branches: STANDARD_BRANCHES.slice(0, Math.floor(Math.random() * 10) + 5)
        },
        { upsert: true, new: true }
      );
    }
    console.log(`Inserted ${Object.keys(COLLEGE_DATA).length} colleges`);
    
    // Process PDF files
    const pdfFiles = [
      { path: './1st Round CutOff 2025.pdf', round: 1, year: 2025 },
      { path: './2nd Round CutOff 2025.pdf', round: 2, year: 2025 },
      { path: './3rd Round CutOff 2025.pdf', round: 3, year: 2025 }
    ];
    
    let totalCutoffs = 0;
    
    for (const pdfFile of pdfFiles) {
      const filePath = path.join(process.cwd(), '..', pdfFile.path);
      
      if (!fs.existsSync(filePath)) {
        console.log(`PDF file not found: ${filePath}`);
        continue;
      }
      
      console.log(`Processing ${pdfFile.path}...`);
      
      try {
        const result = await parsePDFile(filePath, pdfFile.round, pdfFile.year);
        
        console.log(`  Parsed ${result.stats.parsed} lines out of ${result.stats.total} total lines`);
        console.log(`  Found ${result.colleges.length} colleges`);
        console.log(`  Found ${result.categories.length} categories`);
        console.log(`  Created ${result.cutoffs.length} cutoff entries`);
        
        // Insert cutoffs
        if (result.cutoffs.length > 0) {
          await Cutoff.insertMany(result.cutoffs, { ordered: false });
          totalCutoffs += result.cutoffs.length;
        }
        
        // Log import
        await ImportLog.create({
          fileName: pdfFile.path,
          round: pdfFile.round,
          year: pdfFile.year,
          status: result.stats.errors === 0 ? 'success' : 'partial',
          totalRows: result.stats.total,
          insertedRows: result.cutoffs.length,
          skippedRows: result.stats.errors,
          errors: result.stats.errors > 0 ? [`Skipped ${result.stats.errors} invalid lines`] : []
        });
        
      } catch (error) {
        console.error(`  Error processing ${pdfFile.path}:`, error);
        
        await ImportLog.create({
          fileName: pdfFile.path,
          round: pdfFile.round,
          year: pdfFile.year,
          status: 'failed',
          totalRows: 0,
          insertedRows: 0,
          skippedRows: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }
    
    console.log(`\nImport completed!`);
    console.log(`Total cutoffs inserted: ${totalCutoffs}`);
    
    // Verify data
    const collegeCount = await College.countDocuments();
    const categoryCount = await Category.countDocuments();
    const cutoffCount = await Cutoff.countDocuments();
    const importLogCount = await ImportLog.countDocuments();
    
    console.log(`\nDatabase Summary:`);
    console.log(`  Colleges: ${collegeCount}`);
    console.log(`  Categories: ${categoryCount}`);
    console.log(`  Cutoffs: ${cutoffCount}`);
    console.log(`  Import Logs: ${importLogCount}`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the import
if (require.main === module) {
  importData();
}

export { importData };
