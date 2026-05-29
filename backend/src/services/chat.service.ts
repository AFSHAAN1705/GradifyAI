import mongoose, { Types } from "mongoose";
import { env } from "../config/env";
import { ConversationModel } from "../models/conversation.model";
import { KnowledgeBaseModel } from "../models/knowledge-base.model";
import { CollegeModel } from "../models/college.model";
import { CutoffModel } from "../models/cutoff.model";
import { PlacementModel } from "../models/placement.model";
import { BranchModel } from "../models/branch.model";
import { AppError } from "../utils/app-error";

type UserContext = {
  rank?: number;
  category?: string;
  district?: string;
  branches?: string[];
  budget?: number;
  hostel?: boolean;
};

type ChatRequest = {
  conversationId?: string;
  message: string;
  context?: UserContext;
  userId?: string;
};

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
};

const APP_START_TIME = Date.now();
const MONGO_STATE_MAP: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

const SAM_SYSTEM_PROMPT = `You are SAM, the GradifyAI premium AI-powered Karnataka engineering admission counsellor for KCET and COMED-K counselling.

Your personality:
- Empathetic, patient, and encouraging like an experienced counsellor — adapt your tone to the user's emotional state
- If the user sounds anxious or stressed (e.g., "worried", "scared", "nervous", "stressed"), start with reassurance: "I understand this can be stressful. Let's work through this together."
- If the user sounds confused (e.g., "confused", "unsure", "can't decide"), be clear, structured, and offer pros/cons
- If the user sounds excited (e.g., "great", "thanks", "perfect"), match their enthusiasm
- Direct and practical — give actionable advice, not vague suggestions
- Use "based on your rank/profile" to personalize every response
- Never say "I don't know" without offering what you CAN do
- Encourage the user when they share their rank: "That's a [great/good/fair] rank — here's what you can aim for"

Your knowledge:
- KCET counselling: Round 1, Round 2, Extended Round, option entry, upgrade chances, mop-up round
- COMED-K counselling process and key differences from KCET
- College tiers (Tier 1: RVCE/BMS/BNM; Tier 1.5: DSCE/PES/Ramaiah; Tier 2: BIT/SIT/NIE/JSS/JNNCE; Tier 2.5: REVA/CMR/DayandaSagar/GAT; Tier 3: Others)
- Branch quality, placement packages, cutoff trends, industry reputation
- Category-wise cutoff movement (GM, 1G, 2AG, 2BG, 3AG, 3BG, SCG, STG)
- District-wise college distribution across Karnataka (Bangalore, Mysore, Mangalore, Hubli, Belgaum, etc.)
- NIRF rankings, NAAC accreditation, autonomous status, NBA accreditation
- Placement trends: average package, highest package, placement percentage, top recruiters by college
- Career paths: software engineering, data science, AI/ML, core engineering, government jobs, higher studies (MS/M.Tech/MBA)
- Branch future scope: CSE/ISE/AIML for IT; ECE for VLSI/embedded; ME for core; CSBS/CSD for emerging tech
- Engineering college fee structure: government quota vs management quota vs COMED-K

Response format rules:
- Use **bold** for college names, branch names, ranks, important numbers
- Use bullet points for lists and comparisons
- Use --- for section breaks
- When recommending colleges, always group into: Dream / Ambitious / Moderate / Safe
- After any recommendation, include placement insight if available: "Avg ₹XXL | Highest ₹XXL | XX% placed"
- End every response with a question to continue the conversation
- If the user asks about a specific college, include: NIRF rank, NAAC grade, placement data, fee range
- Keep responses concise but thorough — 3-5 paragraphs max
- For strategy questions, always include: Round 1 approach, Round 2 upgrade plan, Extended Round backup
- Use short sections with emoji headers where appropriate (🎯 Dream, ✅ Moderate, 🛡️ Safe, 💼 Placement, 📊 Analysis)`;

// ─── Diagnostic Logger ───────────────────────────────────────────────────────

const geminiStatus = env.GEMINI_API_KEY ? "ONLINE" : "OFFLINE";
console.log(`[SAM] Gemini Status: ${geminiStatus}`);
console.log(`[SAM] Gemini Model: ${env.GEMINI_MODEL}`);
console.log(`[SAM] OpenAI Status: ${env.OPENAI_API_KEY ? "configured" : "not set"}`);
console.log(`[SAM] OpenAI Model: ${env.OPENAI_MODEL}`);

// ─── Startup Gemini Connection Test ──────────────────────────────────────────

async function testGeminiConnection() {
  if (!env.GEMINI_API_KEY) return;
  try {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Respond with only the word ONLINE" }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0 }
        }),
        timeout: 10000,
      }
    );
    if (response.ok) {
      console.log(`[SAM] Gemini connection test: PASSED (${env.GEMINI_MODEL} responded)`);
    } else {
      const body = await response.text().catch(() => "unknown");
      console.error(`[SAM] Gemini connection test: FAILED (HTTP ${response.status})`);
      console.error(`[SAM] Gemini error: ${body.slice(0, 300)}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SAM] Gemini connection test: FAILED (${msg})`);
  }
}
testGeminiConnection();

// ─── Utilities ───────────────────────────────────────────────────────────────

function detectSentiment(text: string): "anxious" | "confused" | "neutral" | "excited" {
  const lower = text.toLowerCase();
  if (/worried|nervous|scared|anxious|stressed|tensed|confused|unsure|help|what should|cannot decide/.test(lower)) return "anxious";
  if (/confused|compare|vs|or|which one|better|difference/.test(lower)) return "confused";
  if (/great|excellent|thanks|perfect|awesome|happy/.test(lower)) return "excited";
  return "neutral";
}

function extractContext(text: string, existing: UserContext): UserContext {
  const ctx = { ...existing };
  const rankMatch = text.match(/(?:rank|ranked|my rank is)\s*[:#]?\s*(\d{3,7})/i);
  if (rankMatch) ctx.rank = parseInt(rankMatch[1], 10);
  const catMatch = text.match(/\b(GM|1G|2AG|2BG|3AG|3BG|SCG|STG|Category\s*\d|OBC|EWS|SC|ST)\b/i);
  if (catMatch) ctx.category = catMatch[1].toUpperCase();
  const districtMatch = text.match(/\b(in|near|around|prefer|from)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/);
  if (districtMatch && districtMatch[2]) {
    const known = ["Bangalore", "Bengaluru", "Mysore", "Mysuru", "Mangalore", "Mangaluru", "Hubli", "Hubballi", "Belgaum", "Belagavi", "Dharwad", "Dakshina Kannada", "Udupi", "Shivamogga", "Tumkur", "Ballari", "Kalaburagi", "Gulbarga", "Shimoga", "Davangere", "Hassan", "Mandya", "Chikmagalur"];
    if (known.includes(districtMatch[2])) ctx.district = districtMatch[2];
  }
  const branchMatch = text.match(/\b(CSE|ISE|ECE|EEE|ME|CIV|AI|DS|AIML|CSBS|CSM|CSD|IOT|AI&DS|IT|BT|ML|CHE)\b/i);
  if (branchMatch) {
    if (!ctx.branches) ctx.branches = [];
    if (!ctx.branches.includes(branchMatch[1].toUpperCase())) {
      ctx.branches.push(branchMatch[1].toUpperCase());
    }
  }
  return ctx;
}

function isRankQuery(text: string): boolean {
  return /\b(rank|ranked|score|percentile)\b/i.test(text);
}

function isCollegeQuery(text: string): boolean {
  return /\b(college|institute|engineering|colleges|dsc|bms|bit|nie|rvce)\b/i.test(text);
}

function isBranchQuery(text: string): boolean {
  return /\b(branch|stream|specialization|CSE|ISE|ECE|AIML|CSBS)\b/i.test(text) && !isCollegeQuery(text);
}

function isCompareQuery(text: string): boolean {
  return /\b(compare|vs|versus|or|which.*better|difference)\b/i.test(text);
}

function isStrategyQuery(text: string): boolean {
  return /\b(strategy|plan|option entry|round|list|choices|suggest|recommend)\b/i.test(text);
}

// ─── College Data Loading ────────────────────────────────────────────────────

async function loadCollegeData(ctx: UserContext) {
  const result: Record<string, unknown> = { colleges: [], cutoffs: [], placements: [], branches: [] };
  if (!ctx.rank) return result;

  const radius = ctx.rank <= 10000 ? 3000 : ctx.rank <= 30000 ? 6000 : ctx.rank <= 60000 ? 10000 : 15000;
  const minRank = Math.max(1, ctx.rank - radius);
  const maxRank = ctx.rank + radius;

  const filter: Record<string, unknown> = {
    rankClose: { $gte: minRank, $lte: maxRank },
    categoryCode: ctx.category || "GM",
  };

  const cutoffs = await CutoffModel.find(filter)
    .sort({ rankClose: 1 })
    .limit(50)
    .populate("collegeId", "code name city district state naacGrade autonomous rankings")
    .populate("branchId", "code name")
    .lean();

  result.cutoffs = cutoffs;

  const collegeIds = [...new Set(cutoffs.map((c: any) => c.collegeId?._id?.toString()).filter(Boolean))];
  if (collegeIds.length) {
    const objectIds = collegeIds.map((id: string) => new Types.ObjectId(id));
    const [collegesData, placementsData] = await Promise.all([
      CollegeModel.find({ _id: { $in: objectIds } }).select("name code city district naacGrade autonomous rankings placementDetails").lean(),
      PlacementModel.aggregate([
        { $match: { collegeId: { $in: objectIds } } },
        { $sort: { academicYear: -1 } },
        { $group: { _id: "$collegeId", placementRate: { $first: "$placementRate" }, averagePackageLpa: { $first: "$averagePackageLpa" }, highestPackageLpa: { $first: "$highestPackageLpa" }, medianPackageLpa: { $first: "$medianPackageLpa" } } }
      ])
    ]);
    result.colleges = collegesData;
    result.placements = placementsData;
  }

  // Also load all branches for reference
  result.branches = await BranchModel.find().select("code name").lean();

  return result;
}

// ─── Context Prompt Builder ──────────────────────────────────────────────────

function buildContextPrompt(ctx: UserContext, collegeData: Record<string, unknown>): string {
  const parts: string[] = ["## User Profile"];
  if (ctx.rank) parts.push(`- KCET Rank: ${ctx.rank.toLocaleString()}`);
  if (ctx.category) parts.push(`- Category: ${ctx.category}`);
  if (ctx.district) parts.push(`- Preferred District: ${ctx.district}`);
  if (ctx.branches?.length) parts.push(`- Preferred Branches: ${ctx.branches.join(", ")}`);
  if (ctx.budget) parts.push(`- Budget: ₹${ctx.budget.toLocaleString()}/year`);
  if (ctx.hostel !== undefined) parts.push(`- Hostel Required: ${ctx.hostel ? "Yes" : "No"}`);

  const cutoffs = collegeData.cutoffs as any[] || [];
  if (cutoffs.length) {
    parts.push("", "## Available Cutoff Data");
    const grouped: Record<string, string[]> = {};
    cutoffs.slice(0, 25).forEach((c: any) => {
      const key = `${c.collegeId?.name || "Unknown"}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(`${c.branchId?.code || "N/A"} (Rank: ${c.rankClose?.toLocaleString()})`);
    });
    Object.entries(grouped).forEach(([college, branches]) => {
      parts.push(`- **${college}**: ${branches.slice(0, 4).join(", ")}${branches.length > 4 ? ` +${branches.length - 4}` : ""}`);
    });
  }

  const placements = collegeData.placements as any[] || [];
  if (placements.length) {
    parts.push("", "## Placement Data");
    placements.slice(0, 8).forEach((p: any) => {
      parts.push(`- College ${p._id}: Avg ₹${p.averagePackageLpa || "N/A"}L, Highest ₹${p.highestPackageLpa || "N/A"}L, ${p.placementRate || "N/A"}% placed`);
    });
  }

  const colleges = collegeData.colleges as any[] || [];
  if (colleges.length) {
    parts.push("", "## College Details");
    colleges.slice(0, 8).forEach((c: any) => {
      const details = [`${c.name} (${c.code})`];
      if (c.city) details.push(`Location: ${c.city}`);
      if (c.naacGrade) details.push(`NAAC: ${c.naacGrade}`);
      if (c.autonomous) details.push("Autonomous");
      if (c.rankings?.nirfRank) details.push(`NIRF: #${c.rankings.nirfRank}`);
      parts.push(`- **${details.join(" | ")}**`);
    });
  }

  return parts.join("\n");
}

// ─── Fetch with Timeout ──────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// ─── Retry Wrapper ───────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 2): Promise<T | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt === maxRetries;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[SAM] ${label} attempt ${attempt + 1}/${maxRetries + 1} failed: ${errMsg}`);
      if (isLast) {
        console.error(`[SAM] ${label} exhausted all retries.`);
        return null;
      }
      await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
    }
  }
  return null;
}

// ─── Gemini Integration ──────────────────────────────────────────────────────

async function callGemini(systemPrompt: string, userMessage: string, contextPrompt: string, history: Array<{ role: string; content: string }>): Promise<string | null> {
  if (!env.GEMINI_API_KEY) {
    console.warn("[SAM] Gemini: No API key configured. Skipping.");
    return null;
  }

  return withRetry(async () => {
    const contents = history.map((h) => ({ role: h.role === "ASSISTANT" ? "model" : "user", parts: [{ text: h.content }] }));
    contents.push({ role: "user", parts: [{ text: `${contextPrompt}\n\nUser question: ${userMessage}` }] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
    console.log(`[SAM] Calling Gemini (${env.GEMINI_MODEL})...`);

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 1200, temperature: 0.7 }
      }),
      timeout: 20000,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown");
      console.error(`[SAM] Gemini HTTP ${response.status}: ${errorBody.slice(0, 500)}`);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as GeminiResponse;
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    if (!text) {
      console.error("[SAM] Gemini returned empty response", JSON.stringify(json).slice(0, 500));
      throw new Error("Gemini returned empty response");
    }
    console.log(`[SAM] Gemini response OK (${text.length} chars)`);
    return text;
  }, "Gemini");
}

// ─── OpenAI Integration ──────────────────────────────────────────────────────

async function callOpenAI(systemPrompt: string, userMessage: string, contextPrompt: string, history: Array<{ role: string; content: string }>): Promise<string | null> {
  if (!env.OPENAI_API_KEY) {
    console.warn("[SAM] OpenAI: No API key configured. Skipping.");
    return null;
  }

  return withRetry(async () => {
    const inputItems = history.map((h) => ({ role: h.role.toLowerCase(), content: [{ type: "input_text" as const, text: h.content }] }));
    inputItems.push({ role: "user", content: [{ type: "input_text" as const, text: `${contextPrompt}\n\nUser question: ${userMessage}` }] });

    console.log(`[SAM] Calling OpenAI (${env.OPENAI_MODEL})...`);

    const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        instructions: systemPrompt,
        input: inputItems,
        max_output_tokens: 1200,
        text: { format: { type: "text" } }
      }),
      timeout: 20000,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown");
      console.error(`[SAM] OpenAI HTTP ${response.status}: ${errorBody.slice(0, 500)}`);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as OpenAIResponse;
    const text = json.output_text ?? json.output?.flatMap((item) => item.content ?? []).map((c) => c.text).filter(Boolean).join("\n") ?? null;
    if (!text) {
      console.error("[SAM] OpenAI returned empty response", JSON.stringify(json).slice(0, 500));
      throw new Error("OpenAI returned empty response");
    }
    console.log(`[SAM] OpenAI response OK (${text.length} chars)`);
    return text;
  }, "OpenAI");
}

// ─── Fallback (Rule-Based) ───────────────────────────────────────────────────

function fallbackResponse(message: string, ctx: UserContext, collegeData: Record<string, unknown>, sentiment: string): string {
  const rank = ctx.rank;
  const category = ctx.category || "GM";
  const cutoffs = collegeData.cutoffs as any[] || [];
  const colleges = collegeData.colleges as any[] || [];
  const placements = collegeData.placements as any[] || [];

  const placementMap = new Map(placements.map((p: any) => [p._id.toString(), p]));

  const getPlacementInsight = (collegeId: string) => {
    const p = placementMap.get(collegeId);
    if (!p) return "";
    return ` Avg: ₹${p.averagePackageLpa || "N/A"}L, Highest: ₹${p.highestPackageLpa || "N/A"}L.`;
  };

  if (sentiment === "anxious") {
    let response = "I understand this is a stressful time. Let me help you navigate this clearly.\n\n";
    if (rank) {
      const radius = rank <= 10000 ? 3000 : rank <= 30000 ? 6000 : rank <= 60000 ? 10000 : 15000;
      response += `Your rank **${rank.toLocaleString()}** is within range of many excellent colleges (searching within ±${radius.toLocaleString()} ranks).\n\n`;
      const dream = cutoffs.filter((c: any) => c.rankClose < rank).slice(0, 3);
      const safe = cutoffs.filter((c: any) => c.rankClose >= rank + 5000).slice(0, 3);
      if (dream.length) response += `**Ambitious options:** ${dream.map((c: any) => `${c.collegeId?.name} ${c.branchId?.code}`).join(", ")}.\n`;
      if (safe.length) response += `**Realistic options:** ${safe.map((c: any) => `${c.collegeId?.name} ${c.branchId?.code}`).join(", ")}.\n`;
      response += "\nMany students with similar ranks secure great colleges through smart option entry. Would you like me to build a complete strategy for you?";
    } else {
      response += "Could you share your KCET rank so I can give you personalized college recommendations and strategy?";
    }
    return response;
  }

  if (isCompareQuery(message) && cutoffs.length >= 2) {
    const groups: Record<string, any[]> = {};
    cutoffs.forEach((c: any) => {
      const key = `${c.collegeId?.name}-${c.branchId?.code}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    const entries = Object.entries(groups).slice(0, 4);
    if (entries.length >= 2) {
      let response = "Here's a comparison of your options:\n\n";
      entries.forEach(([key, vals]) => {
        const c = vals[0];
        const insight = getPlacementInsight(c.collegeId?._id?.toString());
        response += `**${key}**\n- Closing Rank: ${c.rankClose?.toLocaleString() || "N/A"}\n- Category: ${c.categoryCode}${insight}\n\n`;
      });
      response += "---\nWould you like me to recommend which one to prioritize in your option entry list?";
      return response;
    }
  }

  if (isStrategyQuery(message) && rank && cutoffs.length) {
    const radius = rank <= 10000 ? 3000 : rank <= 30000 ? 6000 : rank <= 60000 ? 10000 : 15000;
    const dream = cutoffs.filter((c: any) => c.rankClose < rank).slice(0, 4);
    const moderate = cutoffs.filter((c: any) => c.rankClose >= rank && c.rankClose <= rank + radius / 2).slice(0, 4);
    const safe = cutoffs.filter((c: any) => c.rankClose > rank + radius / 2).slice(0, 4);

    let response = `## Admission Strategy for Rank ${rank.toLocaleString()} (${category})\n\n`;
    response += `Based on rank ${rank.toLocaleString()} with ±${radius.toLocaleString()} search radius:\n\n`;

    if (dream.length) {
      response += "### Dream Choices\n";
      dream.forEach((c: any) => {
        const ins = getPlacementInsight(c.collegeId?._id?.toString());
        response += `- **${c.collegeId?.name}** - ${c.branchId?.code} (Cutoff: ${c.rankClose?.toLocaleString()})${ins}\n`;
      });
      response += "\n";
    }
    if (moderate.length) {
      response += "### Moderate Choices\n";
      moderate.forEach((c: any) => {
        const ins = getPlacementInsight(c.collegeId?._id?.toString());
        response += `- **${c.collegeId?.name}** - ${c.branchId?.code} (Cutoff: ${c.rankClose?.toLocaleString()})${ins}\n`;
      });
      response += "\n";
    }
    if (safe.length) {
      response += "### Safe Choices\n";
      safe.forEach((c: any) => {
        const ins = getPlacementInsight(c.collegeId?._id?.toString());
        response += `- **${c.collegeId?.name}** - ${c.branchId?.code} (Cutoff: ${c.rankClose?.toLocaleString()})${ins}\n`;
      });
      response += "\n";
    }

    response += "---\n### Round Strategy\n";
    response += "- **Round 1**: Place 2-3 dream + 2 moderate options\n";
    response += "- **Round 2**: Monitor movement — upgrade if cutoff drops\n";
    response += "- **Extended Round**: Lock safe option if not upgraded\n\n";
    response += "Would you like me to generate a detailed option entry list with college codes?";
    return response;
  }

  if (isBranchQuery(message)) {
    return "Let me help you choose the right branch. Here's what to consider:\n\n**CSE (Computer Science)**\n- Highest demand, strongest placement records\n- Average package: ₹8-15L across top colleges\n- Best for software engineering, product companies\n\n**ISE (Information Science)**\n- Very similar to CSE in most colleges\n- Slightly lower cutoff, similar opportunities\n\n**ECE (Electronics & Communication)**\n- Core electronics + some software roles\n- Good for VLSI, embedded systems, IT services\n\n**AIML / AI&DS**\n- Emerging branches with growing demand\n- Curriculum varies significantly by college\n\n---\nWhat's your primary goal — highest placement package, core engineering, or future flexibility?";
  }

  if (isCollegeQuery(message) && colleges.length) {
    let response = "## College Insights\n\n";
    colleges.slice(0, 6).forEach((c: any) => {
      const p = placementMap.get(c._id.toString());
      response += `**${c.name}** [${c.code}]\n`;
      response += `- Location: ${c.city}${c.naacGrade ? ` | NAAC: ${c.naacGrade}` : ""}${c.autonomous ? " | Autonomous" : ""}\n`;
      if (p) response += `- Placements: Avg ₹${p.averagePackageLpa || "N/A"}L | Highest ₹${p.highestPackageLpa || "N/A"}L | ${p.placementRate || "N/A"}% placed\n`;
      if (c.rankings?.nirfRank) response += `- NIRF Rank: #${c.rankings.nirfRank}\n`;
      response += "\n";
    });
    response += "Which college would you like to know more about?";
    return response;
  }

  return `Hello! I'm **SAM**, your AI admission counsellor.\n\nI can help you with:\n- **College recommendations** based on your rank\n- **Branch comparison** (CSE vs AIML vs ECE)\n- **Admission strategy** for Round 1, 2, and Extended Round\n- **College comparisons** with placement data\n- **Option entry** guidance\n\nTo give you the best advice, could you share your KCET rank and preferred category?`;
}

// ─── Main Chat ───────────────────────────────────────────────────────────────

export async function chatWithSam(req: ChatRequest) {
  let conversation = req.conversationId
    ? await ConversationModel.findById(req.conversationId)
    : null;

  const sentiment = detectSentiment(req.message);

  // Clean null/empty values from incoming context
  const cleanContext = (c: Record<string, unknown>): UserContext => {
    const out: UserContext = {};
    if (c.rank && typeof c.rank === "number") out.rank = c.rank;
    if (c.category && typeof c.category === "string") out.category = c.category;
    if (c.district && typeof c.district === "string") out.district = c.district;
    if (Array.isArray(c.branches) && c.branches.length > 0) out.branches = c.branches as string[];
    if (c.budget && typeof c.budget === "number") out.budget = c.budget;
    if (c.hostel === true || c.hostel === false) out.hostel = c.hostel;
    return out;
  };

  const rawContext = (conversation?.context as Record<string, unknown> | undefined) || (req.context as Record<string, unknown> | undefined) || {};
  let context = extractContext(req.message, cleanContext(rawContext));

  if (req.context) context = { ...context, ...cleanContext(req.context as Record<string, unknown>) };

  const history = conversation?.messages?.map((m) => ({
    role: m.role,
    content: m.content
  })) || [];

  console.log(`[SAM] Chat request: "${req.message.slice(0, 80)}..." | rank=${context.rank}, cat=${context.category}, ctx=${!!req.context}`);

  const collegeData = context.rank ? await loadCollegeData(context) : {};
  const contextPrompt = buildContextPrompt(context, collegeData);

  let answer: string;
  let provider: "gemini" | "openai" | "fallback" = "fallback";

  // Tier 1: Gemini
  const geminiAnswer = await callGemini(SAM_SYSTEM_PROMPT, req.message, contextPrompt, history);
  if (geminiAnswer) {
    answer = geminiAnswer;
    provider = "gemini";
    console.log("[SAM] Using Gemini response");
  } else {
    // Tier 2: OpenAI
    const openaiAnswer = await callOpenAI(SAM_SYSTEM_PROMPT, req.message, contextPrompt, history);
    if (openaiAnswer) {
      answer = openaiAnswer;
      provider = "openai";
      console.log("[SAM] Using OpenAI response");
    } else {
      // Tier 3: Fallback
      answer = fallbackResponse(req.message, context, collegeData, sentiment);
      provider = "fallback";
      console.log("[SAM] Using fallback response (no AI provider available)");
    }
  }

  if (!conversation) {
    conversation = await ConversationModel.create({
      userId: req.userId ? new Types.ObjectId(req.userId) : undefined,
      title: req.message.slice(0, 100),
      context,
      messages: [],
      provider,
    });
  } else {
    conversation.context = context as any;
    conversation.provider = provider;
  }

  conversation.messages.push(
    { role: "USER", content: req.message, metadata: { sentiment }, context: context as any } as any,
    { role: "ASSISTANT", content: answer, metadata: { provider } } as any
  );

  await conversation.save();

  return {
    conversationId: conversation._id.toString(),
    answer,
    provider,
    context: conversation.context,
    sentiment,
  };
}

// ─── Conversation Management ─────────────────────────────────────────────────

export async function getConversationHistory(conversationId: string) {
  const conv = await ConversationModel.findById(conversationId).lean();
  if (!conv) throw new AppError("Conversation not found", 404);
  return conv;
}

export async function listConversations(userId: string) {
  return ConversationModel.find({ userId: new Types.ObjectId(userId) })
    .select("title context provider createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();
}

export async function deleteConversation(conversationId: string) {
  await ConversationModel.findByIdAndDelete(conversationId);
}

export async function generateStrategy(ctx: UserContext) {
  const collegeData = await loadCollegeData(ctx);
  return { context: ctx, collegeData };
}

// ─── Health Check ────────────────────────────────────────────────────────────

export function getSamHealth() {
  const mongoState = mongoose.connection.readyState;
  const geminiConfigured = !!env.GEMINI_API_KEY;
  const openaiConfigured = !!env.OPENAI_API_KEY;
  return {
    status: "ok",
    mongodb: {
      status: MONGO_STATE_MAP[mongoState] ?? "unknown",
      database: mongoose.connection.name ?? null,
      host: mongoose.connection.host ?? null,
    },
    gemini: {
      configured: geminiConfigured,
      model: env.GEMINI_MODEL,
    },
    openai: {
      configured: openaiConfigured,
      model: env.OPENAI_MODEL,
    },
    mode: geminiConfigured || openaiConfigured ? "ai" : "fallback",
    version: "1.0.0",
    uptime: Math.floor((Date.now() - APP_START_TIME) / 1000),
  };
}

export { type UserContext, type ChatRequest };
