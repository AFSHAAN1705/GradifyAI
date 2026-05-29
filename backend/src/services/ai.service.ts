import { env } from "../config/env";
import { AiChatModel } from "../models/ai-chat.model";

type AiRequest = {
  message: string;
  context?: {
    rank?: number;
    category?: string;
    branches?: string[];
    colleges?: string[];
    round?: number;
  };
  userId?: string;
};

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
};

const SYSTEM_PROMPT = [
  "You are GradifyAI, a premium Karnataka KCET and KEA engineering counselling assistant.",
  "Only answer for Karnataka KCET, KEA counselling, Karnataka engineering admissions, branches, rounds, categories, and option-entry strategy.",
  "Use clear strategic reasoning: dream/moderate/safe choices, Round 1, Round 2, Extended Round movement, category impact, ROI, placement, and branch fit.",
  "Do not invent cutoff ranks. If exact cutoff data is not supplied, say what data is needed and give a cautious strategy."
].join("\n");

function fallbackAdvice(input: AiRequest) {
  const context = input.context;
  const rankLine = context?.rank ? `For KCET rank ${context.rank}` : "For this KCET profile";
  const categoryLine = context?.category ? ` under ${context.category}` : "";
  const roundLine = context?.round ? ` in Round ${context.round}` : " across Round 1, Round 2, and Extended Round";

  return [
    `${rankLine}${categoryLine}${roundLine}, build your KEA option list in layers: dream choices first, then realistic upgrades, then safe allotment anchors.`,
    "Compare the same college-branch-category combination across rounds. A positive movement from Round 1 to Round 2 usually means waiting can be useful, while flat movement means safety should matter more.",
    "For branch comparisons, prioritize long-term fit first, then college peer group, placements, commute, fees, and your willingness to wait until the Extended Round.",
    "Connect OPENAI_API_KEY or GEMINI_API_KEY for live AI reasoning over the same MongoDB-backed counselling context."
  ].join("\n\n");
}

async function callGemini(input: AiRequest): Promise<string | null> {
  if (!env.GEMINI_API_KEY) return null;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${SYSTEM_PROMPT}\n\nUser question: ${input.message}\nKCET context: ${JSON.stringify(input.context ?? {})}` }]
            }
          ],
          generationConfig: { maxOutputTokens: 900, temperature: 0.7 }
        })
      }
    );

    if (!response.ok) return null;
    const json = (await response.json()) as GeminiResponse;
    return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

async function callOpenAI(input: AiRequest): Promise<string | null> {
  if (!env.OPENAI_API_KEY) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        instructions: SYSTEM_PROMPT,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  userQuestion: input.message,
                  kcetContext: input.context ?? {}
                })
              }
            ]
          }
        ],
        max_output_tokens: 900,
        text: { format: { type: "text" } }
      })
    });

    if (!response.ok) return null;
    const json = (await response.json()) as OpenAIResponse;
    return json.output_text ?? json.output?.flatMap((item) => item.content ?? []).map((c) => c.text).filter(Boolean).join("\n") ?? null;
  } catch {
    return null;
  }
}

export async function generateCounsellingAdvice(input: AiRequest) {
  let answer = fallbackAdvice(input);
  let provider: "gemini" | "openai" | "fallback" = "fallback";

  const geminiAnswer = await callGemini(input);
  if (geminiAnswer) {
    answer = geminiAnswer;
    provider = "gemini";
  } else {
    const openaiAnswer = await callOpenAI(input);
    if (openaiAnswer) {
      answer = openaiAnswer;
      provider = "openai";
    }
  }

  const chat = await AiChatModel.create({
    userId: input.userId,
    title: input.message.slice(0, 80),
    messages: [
      { role: "USER", content: input.message, metadata: input.context },
      { role: "ASSISTANT", content: answer, metadata: { provider } }
    ]
  });

  return {
    answer,
    provider,
    chatId: chat._id.toString()
  };
}

export async function compareKcetOptions(input: {
  optionA: string;
  optionB: string;
  rank?: number;
  category?: string;
  userId?: string;
}) {
  return generateCounsellingAdvice({
    userId: input.userId,
    message: `Compare these Karnataka KCET options: ${input.optionA} vs ${input.optionB}. Give branch fit, college value, ROI, round strategy, and final recommendation.`,
    context: {
      rank: input.rank,
      category: input.category,
      colleges: [input.optionA, input.optionB]
    }
  });
}
