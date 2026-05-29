import http from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectMongoDB, disconnectMongoDB } from "./database/mongodb";
import { ensureAdminUser } from "./services/admin-user.service";
import { logger } from "./utils/logger";

async function bootstrap() {
  await connectMongoDB();
  await ensureAdminUser();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    const geminiConfigured = !!env.GEMINI_API_KEY;
    const openaiConfigured = !!env.OPENAI_API_KEY;
    const aiProvider = geminiConfigured ? "Gemini" : openaiConfigured ? "OpenAI" : "Fallback (no API key)";

    console.log(`\n  Backend Running:  http://localhost:${env.PORT}`);
    console.log(`  CORS Origin:     ${env.CLIENT_URL}`);
    console.log(`  Gemini API Key:  ${geminiConfigured ? "LOADED" : "NOT SET"}`);
    console.log(`  AI Provider:     ${aiProvider}`);
    console.log(`  Gemini Model:    ${env.GEMINI_MODEL}`);
    console.log(`  OpenAI Model:    ${env.OPENAI_MODEL}`);
    console.log(`  Health Endpoint: http://localhost:${env.PORT}/api/ai/health\n`);
    logger.info(`Server running on port ${env.PORT}`, {
      port: env.PORT,
      environment: env.NODE_ENV
    });
  });

  const shutdown = async (signal: string) => {
    logger.warn("Shutdown signal received", { signal });
    server.close(async () => {
      await disconnectMongoDB();
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  logger.error("Server failed to start", {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
