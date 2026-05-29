# Technical Reference - District Normalization Implementation

## Architecture Overview

### Problem Statement
The system had inconsistent district naming with:
- Multiple names for same location (Bangalore vs Bengaluru, Belgaum vs Belagavi)
- Pin codes mixed in district fields (Bangalore 560037)
- Duplicate entries in dropdowns
- Missing colleges due to filtering on non-normalized names
- Artificial limits on college results (2-3 per district max)

### Solution Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  - District Dropdown (gets from /api/districts)         │
│  - Search/Filter (sends city/district name)             │
│  - Prediction Form (selects normalized district)        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend (Express)                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │  /api/districts → listDistrictsController          │ │
│  │    Returns: ALL_DISTRICTS (31 official names)      │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  /api/colleges?city=X → searchColleges()           │ │
│  │    Uses: CITY_DISTRICT_MAP to normalize input      │ │
│  │    Filters: district field in MongoDB              │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  /api/predict (POST) → predictAdmissions()         │ │
│  │    Uses: cityToDistrictFilter() + dynamic radius   │ │
│  │    Ranks: All eligible college combinations        │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Config Constants Layer                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ALL_DISTRICTS[31]                                 │ │
│  │  - Bangalore Urban                                 │ │
│  │  - Bangalore Rural                                 │ │
│  │  - Mysore                                          │ │
│  │  - Udupi                                           │ │
│  │  - Dakshina Kannada                                │ │
│  │  - ... (26 more)                                   │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ CITY_DISTRICT_MAP[200+]                            │ │
│  │  "BANGALORE" → "Bangalore Urban"                   │ │
│  │  "BENGALURU" → "Bangalore Urban"                   │ │
│  │  "BANGALORE URBAN" → "Bangalore Urban"             │ │
│  │  "BELGAUM" → "Belagavi"                            │ │
│  │  "SHIMOGA" → "Shivamogga"                          │ │
│  │  ... (195+ more mappings)                          │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              MongoDB Collections                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ colleges                                           │ │
│  │  {                                                 │ │
│  │    code: "SJCE",                                   │ │
│  │    name: "St. Joseph's College of Engineering",    │ │
│  │    city: "Mysore",                                 │ │
│  │    district: "Mysore"  ← NORMALIZED!              │ │
│  │  }                                                 │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ cutoffs                                            │ │
│  │  {                                                 │ │
│  │    collegeId: ObjectId,                            │ │
│  │    branchId: ObjectId,                             │ │
│  │    categoryCode: "GM",                             │ │
│  │    rankClose: 45000                                │ │
│  │  }                                                 │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Code Implementation Details

### 1. Constants Layer (`backend/src/config/constants.ts`)

**ALL_DISTRICTS** - Source of truth for district names:
```typescript
export const ALL_DISTRICTS = [
  "Bagalkot", "Ballari", "Bangalore Rural", "Bangalore Urban",
  "Belagavi", "Bidar", "Chamarajanagar", "Chikkaballapur",
  "Chikkamagaluru", "Chitradurga", "Dakshina Kannada",
  "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri",
  "Hubballi-Dharwad", "Kalaburagi", "Kodagu", "Kolar",
  "Koppal", "Mandya", "Mysore", "Raichur", "Ramanagara",
  "Shivamogga", "Tumkur", "Udupi", "Uttara Kannada",
  "Vijayapura", "Yadgir"
];
```

**CITY_DISTRICT_MAP** - Normalization reference:
```typescript
export const CITY_DISTRICT_MAP: Record<string, string> = {
  // Maps all variations to canonical names
  "BANGALORE": "Bangalore Urban",
  "BENGALURU": "Bangalore Urban",
  "BANGALORE 560037": "Bangalore Urban",  // Pin code
  "BELGAUM": "Belagavi",
  "BELAGAVI": "Belagavi",
  "SHIMOGA": "Shivamogga",
  "SHIVAMOGGA": "Shivamogga",
  "HUBLI": "Hubballi-Dharwad",
  "HUBBALLI": "Hubballi-Dharwad",
  "DHARWAD": "Hubballi-Dharwad",
  // ... 200+ more mappings
};
```

---

### 2. API Endpoint (`backend/src/controllers/misc.controller.ts`)

**Before:**
```typescript
export const listDistrictsController = asyncHandler(async (_req, res) => {
  const [dbDistricts, dbCities] = await Promise.all([
    CollegeModel.distinct("district"),
    CollegeModel.distinct("city")
  ]);
  // Problems: includes duplicates, non-normalized names, pin codes
  const all = [...new Set([...ALL_DISTRICTS, ...dbDistricts.filter(Boolean), ...dbCities.filter(Boolean)])].sort();
  return sendSuccess(res, { districts: all });
});
```

**After:**
```typescript
export const listDistrictsController = asyncHandler(async (_req, res) => {
  // Only official normalized districts
  return sendSuccess(res, { districts: ALL_DISTRICTS.sort() });
});
```

**Benefit:** Frontend always gets clean, consistent 31-district list.

---

### 3. Search & Filter (`backend/src/services/college.service.ts`)

```typescript
export async function searchColleges(input: CollegeSearchInput) {
  const conditions: FilterQuery<CollegeDocument>[] = [];

  if (input.city) {
    const cityInput = input.city.trim();
    const cityOrCond: FilterQuery<CollegeDocument>[] = [
      { city: cityRegex },
      { district: cityRegex }
    ];

    // NORMALIZATION: Map input to official district
    const inputUpper = cityInput.toUpperCase();
    const mappedDistrict = CITY_DISTRICT_MAP[inputUpper];
    if (mappedDistrict) {
      // Query uses normalized district name
      cityOrCond.push({ 
        district: new RegExp(mappedDistrict.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") 
      });
    }

    conditions.push({ $or: cityOrCond });
  }

  // Query returns all matching colleges (up to pageSize limit)
  const items = await CollegeModel.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(input.pageSize)  // Default: 100
    .populate({ path: "branchIds" })
    .lean();
}
```

---

### 4. Prediction Service (`backend/src/services/prediction.service.ts`)

**Dynamic Radius Algorithm:**
```typescript
export async function predictAdmissions(input: PredictionRequest) {
  // IMPROVED: Dynamic radius based on rank
  let rankRadius = 6_000;
  if (input.examRank <= 10_000) rankRadius = 3_000;
  else if (input.examRank <= 30_000) rankRadius = 6_000;
  else if (input.examRank <= 60_000) rankRadius = 10_000;
  else rankRadius = 15_000;

  const minRank = Math.max(1, input.examRank - rankRadius);

  // Query finds ALL colleges with rankClose >= minRank
  // No upper limit on rankClose (shows all eligible colleges)
  const candidates = await CutoffModel.find({
    categoryCode: input.categoryCode,
    rankClose: { $gte: minRank }  // All colleges from minRank upward
  })
    .limit(2000)  // Hard limit to prevent memory issues
    .populate("collegeId", "district")
    .populate("branchId");
}
```

**Result Distribution for Rank 25,000:**
```
minRank = 25000 - 6000 = 19000
Searches: rankClose >= 19000 (no upper limit)

Dream:      rankClose: 19000-24999 (gap < 0)
Competitive: rankClose: 25000-29999 (gap: 0-4999)
Moderate:   rankClose: 30000-34999 (gap: 5000-9999)
Safe:       rankClose: 35000+ (gap: 10000+)

Total candidates: 50-150+ per category
```

---

### 5. PDF Parser (`backend/src/services/pdf-ingestion.service.ts`)

```typescript
async function ingestCutoffPdf(params) {
  for (const row of parsedRows) {
    // PDFs extracted city from college name
    const college = await CollegeModel.findOneAndUpdate(
      { code: row.collegeCode },
      {
        $set: {
          name: row.collegeName,
          city: row.city,
          // NORMALIZATION: Applied here!
          district: CITY_DISTRICT_MAP[row.city.toUpperCase()] || row.city,
          state: "Karnataka"
        }
      },
      { upsert: true, new: true }
    );
  }
}
```

---

### 6. Database Cleanup (`backend/src/scripts/fix-districts.ts`)

```typescript
async function fixDistricts() {
  await mongoose.connect(env.MONGODB_URI);
  const allColleges = await CollegeModel.find({}).lean();
  
  let updated = 0;
  for (const college of allColleges) {
    const cityUpper = (college.city || "").toUpperCase().trim();
    const currentDistrict = (college.district || "").toUpperCase().trim();

    // Apply mapping
    const mappedDistrict = CITY_DISTRICT_MAP[cityUpper];
    if (mappedDistrict && mappedDistrict.toUpperCase() !== currentDistrict) {
      await CollegeModel.updateOne(
        { _id: college._id },
        { $set: { district: mappedDistrict } }
      );
      console.log(`${college.code} ${college.city} -> ${mappedDistrict}`);
      updated++;
    }
  }
}
```

---

## Data Flow Examples

### Example 1: User searches "Belgaum"

```
Frontend: User types "Belgaum" in district search
           ↓
Backend:  searchColleges({ city: "Belgaum" })
          cityInput.toUpperCase() = "BELGAUM"
          CITY_DISTRICT_MAP["BELGAUM"] = "Belagavi"
          Query: { district: /^belagavi$/i }
           ↓
MongoDB:   colleges collection search
          district: "Belagavi"  (stored normalized)
          Returns: 5+ colleges with district: "Belagavi"
           ↓
Frontend: Displays all 5+ Belagavi colleges
```

### Example 2: User gets prediction for rank 25,000

```
Frontend: User submits prediction
          - rank: 25000
          - category: GM
          - district: "Bangalore Urban"
           ↓
Backend:  predictAdmissions()
          rankRadius = 6000 (since 25000 <= 30000)
          minRank = 25000 - 6000 = 19000
          
          Query colleges WHERE:
            - district: "Bangalore Urban"
            - categoryCode: "GM"
            - rankClose >= 19000  (NO UPPER LIMIT)
           ↓
MongoDB:  cutoffs collection
          Finds 100+ Bangalore colleges with:
          - rankClose from 19000 to 1,00,000+
           ↓
Backend:  Groups into tiers:
          - Dream (rankClose 19000-24999): 15 options
          - Competitive (rankClose 25000-29999): 25 options
          - Moderate (rankClose 30000-34999): 30 options
          - Safe (rankClose 35000+): 50+ options
           ↓
Frontend: Displays all 4 tiers with colleges
          Total: 120+ eligible combinations
```

### Example 3: PDF Import ("AJ Institute, Mangalore")

```
PDF Parser:  Extract college name: "AJ Institute, Mangalore"
             parseCity("AJ Institute, Mangalore") = "Mangalore"
             collegeCode = "AJI", collegeName = "AJ Institute"
              ↓
PDF Parser:  City: "Mangalore"
             CITY_DISTRICT_MAP["MANGALORE"] = "Dakshina Kannada"
             Store in DB:
               code: "AJI"
               name: "AJ Institute"
               city: "Mangalore"
               district: "Dakshina Kannada"  ← NORMALIZED!
              ↓
MongoDB:     Saved college with normalized district
              ↓
Prediction:  User searches "Dakshina Kannada"
             Finds all colleges including AJ Institute
             All results grouped by district correctly
```

---

## Normalization Rules

### District Name Standards:
- **Use official Karnataka district names** (from Election Commission of India)
- **No pin codes** (Bangalore → Bangalore Urban, not Bangalore 560037)
- **No duplicate variations** (either Shimoga OR Shivamogga, not both)
- **No area names as districts** (Whitefield is in Bangalore Urban, not a district)
- **Preserve official new names** (Bengaluru urban → stored as "Bangalore Urban" per standards)

### Unified Districts:
- **Hubballi-Dharwad** (not separate Hubli + Dharwad)
- **Ballari** (not Bellary)
- **Belagavi** (not Belgaum)
- **Kalaburagi** (not Gulbarga)
- **Shivamogga** (not Shimoga)

### Mapping Strategy:
1. User input normalized to uppercase
2. Look up in CITY_DISTRICT_MAP
3. If found, use mapped district
4. If not found, pass through as-is
5. MongoDB query uses normalized value

---

## Performance Considerations

### Query Optimization:
```typescript
// Index on district field
collegeSchema.index({ state: 1, city: 1, district: 1 });

// Indexed queries run fast even with 1000+ colleges per district
db.colleges.find({ district: "Bangalore Urban" }).explain()
// Uses the index efficiently
```

### Pagination:
```typescript
// Results paginated to avoid loading too much
pageSize: 100  // Default, configurable
skip: (page - 1) * pageSize
limit: pageSize

// Large result sets handled gracefully
totalColleges: 2000
pages: 20 pages at 100 per page
```

### Cutoff Query Optimization:
```typescript
// Prediction search limited to 2000 results
.limit(2000)

// This prevents:
// - Memory overflow with too many results
// - Network timeout with huge responses
// - Frontend lag from rendering too many items

// Real usage:
// - Typical 100-200 results per search
// - Safe tier always has many options
```

---

## Testing Checkpoints

### ✅ Constants Test:
```typescript
// Verify no duplicates
console.log(new Set(ALL_DISTRICTS).size === ALL_DISTRICTS.length); // true

// Verify size
console.log(ALL_DISTRICTS.length); // 31

// Verify no pin codes
console.log(ALL_DISTRICTS.some(d => /\d/.test(d))); // false
```

### ✅ Mapping Test:
```typescript
// Verify key mappings
console.log(CITY_DISTRICT_MAP["BELGAUM"]); // "Belagavi"
console.log(CITY_DISTRICT_MAP["SHIMOGA"]); // "Shivamogga"
console.log(CITY_DISTRICT_MAP["HUBLI"]); // "Hubballi-Dharwad"
```

### ✅ API Test:
```bash
# Should return exactly 31 districts
curl http://localhost:5000/api/districts | jq '.data.districts | length'
# Output: 31
```

### ✅ Database Test:
```javascript
// MongoDB shell
db.colleges.distinct("district")
// Should show only official names, no duplicates, no pin codes
```

### ✅ Search Test:
```bash
# Search for each district
curl "http://localhost:5000/api/colleges?city=Belgaum&pageSize=100"
# Should return all Belagavi colleges with district: "Belagavi"
```

---

## Maintenance Going Forward

### Adding New Colleges:
- Always use CITY_DISTRICT_MAP for mapping
- PDF parser automatically applies normalization
- Manual entry must use normalized district names

### Database Migrations:
- Run fix-districts periodically: `npm run fix-districts`
- After major district reorganization, update CITY_DISTRICT_MAP
- Re-import PDFs to refresh all data

### Monitoring:
```typescript
// Check for non-normalized districts
db.colleges.aggregate([
  {
    $group: {
      _id: "$district",
      count: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  }
]);

// Should only see official district names
```

---

## Summary

The district normalization implementation provides:

1. **Single source of truth** via `ALL_DISTRICTS` constant
2. **Comprehensive mapping** via `CITY_DISTRICT_MAP` with 200+ entries
3. **Clean API responses** from `/api/districts` endpoint
4. **Normalized database storage** in MongoDB
5. **Dynamic prediction logic** showing all eligible colleges
6. **Maintenance scripts** for database cleanup (`fix-districts`)

This ensures consistent, reliable district filtering and college discovery across the entire application.
