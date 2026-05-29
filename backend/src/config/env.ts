import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env"), override: false });

// Treat empty string as "not set" for optional keys
const nonEmptyOptional = z.string().min(1).optional().transform(v => v || undefined);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required."),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters."),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_COOKIE_NAME: z.string().default("gradify_ai_token"),
  OPENAI_API_KEY: nonEmptyOptional,
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  GEMINI_API_KEY: nonEmptyOptional,
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  UPLOAD_DIR: z.string().default("uploads")
});

export const env = envSchema.parse(process.env);

// Log AI provider status
const status = env.GEMINI_API_KEY ? "ONLINE" : "OFFLINE";
const keyPreview = env.GEMINI_API_KEY
  ? `${env.GEMINI_API_KEY.slice(0, 8)}...${env.GEMINI_API_KEY.slice(-4)}`
  : "—";
console.log(`[ENV] GEMINI Status: ${status}`);
console.log(`[ENV] GEMINI Key: ${keyPreview}`);
console.log(`[ENV] GEMINI Model: ${env.GEMINI_MODEL}`);
console.log(`[ENV] OPENAI Key: ${env.OPENAI_API_KEY ? "configured" : "not set"}`);
console.log(`[ENV] OPENAI Model: ${env.OPENAI_MODEL}`);
if (!env.GEMINI_API_KEY && !env.OPENAI_API_KEY) {
  console.log("[ENV] No AI provider configured — SAM will use offline fallback mode.");
}
