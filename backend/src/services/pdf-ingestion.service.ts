import fs from "node:fs/promises";
import path from "node:path";
import pdf from "pdf-parse";
import { KCET_BRANCH_ALIASES, KCET_CATEGORIES } from "../config/constants";
import { BranchModel } from "../models/branch.model";
import { CategoryModel } from "../models/category.model";
import { CollegeModel } from "../models/college.model";
import { CutoffModel } from "../models/cutoff.model";
import { inferCityFromText, inferDistrictFromText } from "../utils/location-normalizer";

const CATEGORY_CODES = KCET_CATEGORIES.map((category) => category.code);
const CATEGORY_SET = new Set<string>(CATEGORY_CODES);

type ParsedCutoff = {
  collegeCode: string;
  collegeName: string;
  city: string;
  state: string;
  branchCode: string;
  branchName: string;
  categoryCode: string;
  categoryName: string;
  rankClose: number;
  sourceLine: string;
};

function cleanLine(line: string) {
  return line.replace(/\s+/g, " ").trim();
}

function parseCity(collegeName: string) {
  return inferCityFromText(collegeName);
}

function inferRound(text: string, fallbackRound = 1) {
  const match = text.match(/(\d+)(?:st|nd|rd|th)?\s+Round/i);
  return match ? Number(match[1]) : fallbackRound;
}

function inferYear(text: string) {
  const m1 = text.match(/UGCET[- ]?(?<year>\d{4})/i);
  const m2 = text.match(/Admission System[- ]?(?<year>\d{4})/i);
  const m3 = text.match(/20\d{2}/);
  return m1?.groups?.year ? Number(m1.groups.year) : m2?.groups?.year ? Number(m2.groups.year) : m3 ? Number(m3[0]) : 2025;
}

function normalizeRank(value: string) {
  if (value === "--" || value === "" || value === "-") return null;
  const cleaned = value.replace(/[,]/g, "").replace(/\.$/, "");
  const rank = Math.round(Number(cleaned));
  return Number.isFinite(rank) && rank > 0 ? rank : null;
}

function isRankToken(value: string) {
  return value === "--" || value === "-" || /^\d{1,7}(?:\.\d+)?\.?$/.test(value.replace(/,/g, ""));
}

function compactBranchText(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "").toUpperCase();
}

function branchCodeFor(courseName: string) {
  const cleaned = courseName.replace(/\s+/g, " ").trim();
  const lookupKey = cleaned.toUpperCase();
  if (KCET_BRANCH_ALIASES[lookupKey]) return KCET_BRANCH_ALIASES[lookupKey];

  const normalizedCompact = compactBranchText(cleaned.replace(/([a-z])([A-Z])/g, "$1 $2"));
  const aliasEntries = Object.entries(KCET_BRANCH_ALIASES)
    .map(([key, code]) => ({ key: compactBranchText(key), code }))
    .sort((a, b) => b.key.length - a.key.length);
  for (const { key, code } of aliasEntries) {
    if (normalizedCompact.includes(key) || key.includes(normalizedCompact)) return code;
  }

  const words = cleaned.split(/\s+/).filter((w) => w.length > 1 && w !== "AND" && w !== "&" && w !== "OF" && w !== "THE");
  if (words.length <= 4) {
    const acronym = words.map((w) => w[0]).join("").toUpperCase().slice(0, 6);
    if (acronym.length >= 2) return acronym;
  }

  const stripped = compactBranchText(cleaned);
  const known = ["CSE", "ECE", "EEE", "ISE", "ME", "CIV", "AI", "DS", "CS"];
  for (const k of known) {
    if (stripped.includes(k)) return k;
  }

  return stripped.slice(0, 8);
}

const BRANCH_DISPLAY_NAMES: Record<string, string> = {
  "AI": "Artificial Intelligence",
  "AI&DS": "Artificial Intelligence and Data Science",
  "AIML": "Artificial Intelligence and Machine Learning",
  "AERO": "Aeronautical Engineering",
  "AU": "Automobile Engineering",
  "BM": "Biomedical Engineering",
  "BT": "Biotechnology",
  "CHE": "Chemical Engineering",
  "CIV": "Civil Engineering",
  "CS": "Cyber Security",
  "CSBS": "Computer Science and Business Systems",
  "CSD": "Computer Science and Engineering (Data Science)",
  "CSE": "Computer Science and Engineering",
  "CSM": "Computer Science and Engineering (AI & ML)",
  "DS": "Data Science",
  "ECE": "Electronics and Communication Engineering",
  "EEE": "Electrical and Electronics Engineering",
  "EIE": "Electronics and Instrumentation Engineering",
  "EV": "Environmental Engineering",
  "FT": "Food Technology",
  "IE": "Industrial Engineering and Management",
  "IN": "Instrumentation Technology",
  "IOT": "Internet of Things",
  "ISE": "Information Science and Engineering",
  "IT": "Information Technology",
  "MCA": "Master of Computer Applications",
  "ME": "Mechanical Engineering",
  "ML": "Medical Electronics",
  "MN": "Mining Engineering",
  "MT": "Metallurgical Engineering",
  "PM": "Polymer Science",
  "PT": "Petroleum Engineering",
  "RAI": "Robotics and Artificial Intelligence",
  "TC": "Telecommunication Engineering",
  "TX": "Textile Technology"
};

function branchDisplayNameFor(courseName: string) {
  const code = branchCodeFor(courseName);
  return BRANCH_DISPLAY_NAMES[code] ?? courseName.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim();
}

const COLLEGE_HEADER_RE = /(?:University|College|Institute|Academy|School)/i;

function isNonCourseLine(line: string) {
  return /^(?:Page\s+\d+\s+of|Non-Interactive|UGCET|Seat Type|KARNATAKA EXAMINATIONS AUTHORITY)/i.test(line);
}

export async function ingestCutoffPdf(params: {
  filePath: string;
  originalName: string;
  year?: number;
  round?: number;
}) {
  const buffer = await fs.readFile(params.filePath);
  const document = await pdf(buffer);
  const text = document.text;
  const year = params.year ?? inferYear(text) ?? 2025;
  const round = params.round ?? inferRound(params.originalName);
  const source = params.originalName;
  const allLines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);

  const parsedRows: ParsedCutoff[] = [];
  const failedRows: Array<{ line: string; reason: string }> = [];
  const seenKeys = new Set<string>();

  let currentCollege: { code: string; name: string } | null = null;
  let currentCourse: string | null = null;
  let activeCategories: string[] = [];
  let pendingRanks: string[] = [];
  let pendingCategories: string[] = [];

  function flushPendingRanks(college: { code: string; name: string } | null, course: string | null) {
    if (!pendingRanks.length || !college || !course) return;
    const ranks = pendingRanks;
    const cats = pendingCategories.length >= ranks.length ? pendingCategories : CATEGORY_CODES.slice(0, ranks.length);

    ranks.forEach((value, vi) => {
      const rankClose = normalizeRank(value);
      if (!rankClose) return;
      const categoryCode = cats[vi] ?? CATEGORY_CODES[vi % CATEGORY_CODES.length];
      const category = KCET_CATEGORIES.find((item) => item.code === categoryCode);
      const bCode = branchCodeFor(course);
      const key = `${college.code}|${bCode}|${categoryCode}|${year}|${round}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      parsedRows.push({
        collegeCode: college.code,
        collegeName: college.name,
        city: parseCity(college.name),
        state: "Karnataka",
        branchCode: bCode,
        branchName: branchDisplayNameFor(course),
        categoryCode,
        categoryName: category?.name ?? categoryCode,
        rankClose,
        sourceLine: `${college.code} ${course} ${categoryCode} ${rankClose}`
      });
    });
    pendingRanks = [];
    pendingCategories = [];
  }

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];

    const collegeMatch = line.match(/^College:\s*\(?(?<code>[A-Z0-9]{3,6})\)?\s*(?<name>.+)/i);
    const codeNameMatch = line.match(/^\(?(?<code>[A-Z0-9]{3,6})\)?\s+(?<name>[A-Z].{5,}(?:College|Institute|University|Academy|School).+)/i);
    const courseMatch = line.match(/^(?:Course:\s*)?(?:(?:Name:\s*)?)(?<course>.{5,})/i);

    if (collegeMatch?.groups) {
      flushPendingRanks(currentCollege!, currentCourse!);
      currentCollege = {
        code: collegeMatch.groups.code.trim().toUpperCase(),
        name: collegeMatch.groups.name.replace(/Course Name$/i, "").trim()
      };
      currentCourse = null;
      activeCategories = [];
      continue;
    }

    if (codeNameMatch?.groups && COLLEGE_HEADER_RE.test(line)) {
      flushPendingRanks(currentCollege, currentCourse);
      currentCollege = {
        code: codeNameMatch.groups.code.trim().toUpperCase(),
        name: codeNameMatch.groups.name.trim()
      };
      currentCourse = null;
      activeCategories = [];
      continue;
    }

    const upperLine = line.toUpperCase();
    if (CATEGORY_SET.has(upperLine)) {
      activeCategories.push(upperLine);
      continue;
    }

    if (!currentCollege) {
      continue;
    }

    const lineIsSingleRank = isRankToken(line);
    if (courseMatch?.groups && !lineIsSingleRank && !isNonCourseLine(line)) {
      flushPendingRanks(currentCollege, currentCourse!);
      const raw = courseMatch.groups.course.trim();
      if (!COLLEGE_HEADER_RE.test(raw) && raw.length > 3) {
        currentCourse = raw;
        continue;
      }
    }

    if (!currentCourse) {
      if (line.length > 3 && !lineIsSingleRank && !isNonCourseLine(line) && !COLLEGE_HEADER_RE.test(line) && !/^\d/.test(line)) {
        flushPendingRanks(currentCollege, currentCourse);
        currentCourse = line;
        continue;
      }
      continue;
    }

    const tokens = line.split(/\s+/);

    if (CATEGORY_SET.has(tokens[0]?.toUpperCase())) {
      continue;
    }

    const rankTokens = tokens.filter((t) => isRankToken(t));

    if (rankTokens.length >= 2) {
      flushPendingRanks(currentCollege, currentCourse);

      const cats = activeCategories.length >= rankTokens.length ? activeCategories : CATEGORY_CODES.slice(0, rankTokens.length);

      rankTokens.forEach((value, vi) => {
        const rankClose = normalizeRank(value);
        if (!rankClose) return;

        const categoryCode = cats[vi] ?? CATEGORY_CODES[vi % CATEGORY_CODES.length];
        const category = KCET_CATEGORIES.find((item) => item.code === categoryCode);
        const courseName = currentCourse || "Engineering";
        const bCode = branchCodeFor(courseName);
        const key = `${currentCollege!.code}|${bCode}|${categoryCode}|${year}|${round}`;
        if (seenKeys.has(key)) return;
        seenKeys.add(key);

        parsedRows.push({
          collegeCode: currentCollege!.code,
          collegeName: currentCollege!.name,
          city: parseCity(currentCollege!.name),
          state: "Karnataka",
          branchCode: bCode,
          branchName: branchDisplayNameFor(courseName),
          categoryCode,
          categoryName: category?.name ?? categoryCode,
          rankClose,
          sourceLine: `${currentCollege!.code} ${courseName} ${categoryCode} ${rankClose}`
        });
      });

      currentCourse = null;
      continue;
    }

    if (rankTokens.length === 1) {
      const categoryCode = activeCategories[pendingRanks.length] ?? CATEGORY_CODES[pendingRanks.length % CATEGORY_CODES.length];
      pendingRanks.push(rankTokens[0]);
      pendingCategories.push(categoryCode);
      continue;
    }

    const singleMatch = line.match(
      new RegExp(
        `^(?<code>[A-Z0-9]{3,6})\\s+(?<branch>.{2,30}?)\\s+(?<category>${CATEGORY_CODES.join("|")})\\s+(?<rank>\\d{2,7})(?:\\s|$)`,
        "i"
      )
    );

    if (singleMatch?.groups && currentCollege) {
      flushPendingRanks(currentCollege, currentCourse);
      const categoryCode = singleMatch.groups.category.toUpperCase();
      const rankClose = normalizeRank(singleMatch.groups.rank);
      if (rankClose) {
        const courseName = singleMatch.groups.branch.trim();
        const bCode = branchCodeFor(courseName);
        const category = KCET_CATEGORIES.find((item) => item.code === categoryCode);
        const key = `${currentCollege.code}|${bCode}|${categoryCode}|${year}|${round}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          parsedRows.push({
            collegeCode: currentCollege.code,
            collegeName: currentCollege.name,
            city: parseCity(currentCollege.name),
            state: "Karnataka",
            branchCode: bCode,
            branchName: branchDisplayNameFor(courseName),
            categoryCode,
            categoryName: category?.name ?? categoryCode,
            rankClose,
            sourceLine: line
          });
        }
      }
      continue;
    }

    if (/^\d{3,6}\s+/.test(line)) {
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        const code = parts[0];
        const last = parts[parts.length - 1];
        const secondLast = parts[parts.length - 2];
        if (CATEGORY_SET.has(secondLast.toUpperCase()) && isRankToken(last)) {
          flushPendingRanks(currentCollege, currentCourse);
          const courseName = parts.slice(1, -2).join(" ");
          const bCode = branchCodeFor(courseName);
          const categoryCode = secondLast.toUpperCase();
          const rankClose = normalizeRank(last);
          if (rankClose && currentCollege) {
            const key = `${code}|${bCode}|${categoryCode}|${year}|${round}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              parsedRows.push({
                collegeCode: code,
                collegeName: currentCollege.name,
                city: parseCity(currentCollege.name),
                state: "Karnataka",
                branchCode: bCode,
                branchName: branchDisplayNameFor(courseName),
                categoryCode,
                categoryName: KCET_CATEGORIES.find((c) => c.code === categoryCode)?.name ?? categoryCode,
                rankClose,
                sourceLine: line
              });
            }
          }
        }
      }
      continue;
    }
  }

  flushPendingRanks(currentCollege!, currentCourse!);

  let imported = 0;
  for (const row of parsedRows) {
    const [college, branch] = await Promise.all([
      CollegeModel.findOneAndUpdate(
        { code: row.collegeCode },
        {
          $set: {
            name: row.collegeName,
            city: row.city,
            district: inferDistrictFromText(row.collegeName, row.city),
            state: "Karnataka"
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
      BranchModel.findOneAndUpdate(
        { code: row.branchCode },
        {
          $set: { name: row.branchName },
          $addToSet: { aliases: { $each: [row.branchCode, row.branchName.toUpperCase()] } }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    ]);

    await CategoryModel.findOneAndUpdate(
      { code: row.categoryCode },
      {
        $set: {
          name: row.categoryName,
          group: KCET_CATEGORIES.find((category) => category.code === row.categoryCode)?.group,
          tags: KCET_CATEGORIES.find((category) => category.code === row.categoryCode)?.tags ?? []
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await CollegeModel.updateOne({ _id: college._id }, { $addToSet: { branchIds: branch._id } });

    await CutoffModel.findOneAndUpdate(
      {
        collegeId: college._id,
        branchId: branch._id,
        categoryCode: row.categoryCode,
        year,
        round,
        quota: "STATE",
        seatType: ""
      },
      {
        $set: {
          categoryName: row.categoryName,
          roundLabel: `Round ${round}`,
          rankClose: row.rankClose,
          source,
          sourceLine: row.sourceLine
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    imported += 1;
  }

  return {
    file: path.basename(params.originalName),
    year,
    round,
    imported,
    skipped: allLines.length - parsedRows.length,
    failedRows: failedRows.slice(0, 50)
  };
}
