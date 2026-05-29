import { ALL_DISTRICTS, CITY_DISTRICT_MAP } from "../config/constants";

const PIN_CODE_RE = /\b(?:PIN\s*CODE\s*-?)?\d{6}\b/gi;
const COURSE_NAME_RE = /COURSE\s*NAME/gi;

function normalizeForLookup(value: string) {
  return value
    .replace(COURSE_NAME_RE, " ")
    .replace(PIN_CODE_RE, " ")
    .replace(/&/g, " AND ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase())
    .replace(/\bKgF\b/g, "KGF");
}

function phraseInText(text: string, phrase: string) {
  if (!text || !phrase) return false;
  return ` ${text} `.includes(` ${phrase} `);
}

const normalizedDistricts = ALL_DISTRICTS.map((district) => ({
  district,
  normalized: normalizeForLookup(district)
})).sort((a, b) => b.normalized.length - a.normalized.length);

const normalizedAliases = Object.entries(CITY_DISTRICT_MAP)
  .map(([alias, district]) => ({
    alias,
    normalizedAlias: normalizeForLookup(alias),
    district
  }))
  .filter((item) => item.normalizedAlias.length > 0)
  .sort((a, b) => b.normalizedAlias.length - a.normalizedAlias.length);

export function cleanLocationText(value: string) {
  return value
    .replace(COURSE_NAME_RE, " ")
    .replace(PIN_CODE_RE, " ")
    .replace(/\s*-\s*\d{1,3}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDistrictName(value?: string | null) {
  if (!value) return null;
  const normalized = normalizeForLookup(value);
  if (!normalized) return null;

  const exactAlias = normalizedAliases.find((item) => item.normalizedAlias === normalized);
  if (exactAlias) return exactAlias.district;

  const exactDistrict = normalizedDistricts.find((item) => item.normalized === normalized);
  if (exactDistrict) return exactDistrict.district;

  return null;
}

export function inferDistrictFromText(...values: Array<string | null | undefined>) {
  const normalized = normalizeForLookup(values.filter(Boolean).join(" "));
  if (!normalized) return "";

  const direct = normalizeDistrictName(normalized);
  if (direct) return direct;

  const aliasMatch = normalizedAliases.find((item) => phraseInText(normalized, item.normalizedAlias));
  if (aliasMatch) return aliasMatch.district;

  const districtMatch = normalizedDistricts.find((item) => phraseInText(normalized, item.normalized));
  return districtMatch?.district ?? "";
}

export function inferCityFromText(...values: Array<string | null | undefined>) {
  const rawText = values.filter(Boolean).join(" ");
  const normalized = normalizeForLookup(rawText);
  if (!normalized) return "Karnataka";

  const aliasMatch = normalizedAliases.find((item) => phraseInText(normalized, item.normalizedAlias));
  if (aliasMatch) {
    const alias = cleanLocationText(aliasMatch.alias.replace(/\bDISTRICT\b/gi, " "));
    return toTitleCase(alias || aliasMatch.district);
  }

  const cleaned = cleanLocationText(rawText);
  const commaParts = cleaned.split(",").map((part) => cleanLocationText(part)).filter(Boolean);
  const tail = commaParts[commaParts.length - 1];
  if (tail) {
    const tailWords = tail.split(/\s+/).slice(0, 4).join(" ");
    return toTitleCase(tailWords);
  }

  return "Karnataka";
}

export function districtSearchTerms(input: string) {
  const normalizedInput = normalizeForLookup(input);
  const district = inferDistrictFromText(input);
  const terms = new Set<string>();

  if (input.trim()) terms.add(cleanLocationText(input));
  if (district) terms.add(district);

  for (const alias of normalizedAliases) {
    if (
      alias.district === district ||
      alias.normalizedAlias === normalizedInput ||
      phraseInText(alias.normalizedAlias, normalizedInput) ||
      phraseInText(normalizedInput, alias.normalizedAlias)
    ) {
      terms.add(cleanLocationText(alias.alias));
    }
  }

  return { district, terms: [...terms].filter(Boolean) };
}
