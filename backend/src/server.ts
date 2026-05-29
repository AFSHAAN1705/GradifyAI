import http from "node:http";
import dns from "node:dns";
import mongoose from "mongoose";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectMongoDB, disconnectMongoDB } from "./database/mongodb";
import { ensureAdminUser } from "./services/admin-user.service";
import { logger } from "./utils/logger";

const START_TIME = Date.now();
export function getUptime() {
  return Math.floor((Date.now() - START_TIME) / 1000);
}

async function runStartupDiagnostics(mongoConnected: boolean) {
  console.log("\n  ─── Startup Diagnostics ───");
  console.log(`  MongoDB:         ${mongoConnected ? "CONNECTED" : "FAILED"}`);

  if (mongoConnected) {
    const db = mongoose.connection.db;
    if (db) {
      try {
        const collections = await db.listCollections().toArray();
        console.log(`  Active DB:        ${mongoose.connection.name}`);
        console.log(`  Collections:      ${collections.length}`);
        if (collections.length > 0) {
          const names = collections.map((c) => c.name).join(", ");
          console.log(`  Collection Names: ${names.slice(0, 120)}${names.length > 120 ? "..." : ""}`);
        }
      } catch (err) {
        console.log(`  Collections:      ERROR listing collections`);
      }
    }
  } else {
    const uriMatch = env.MONGODB_URI.match(/@([^/]+)/);
    const atlasHost = uriMatch?.[1];
    if (atlasHost) {
      try {
        await dns.promises.resolve(atlasHost);
        console.log(`  Atlas DNS:       OK (${atlasHost})`);
      } catch {
        try {
          await dns.promises.resolveSrv(`_mongodb._tcp.${atlasHost}`);
          console.log(`  Atlas SRV:       OK (${atlasHost})`);
        } catch {
          console.log(`  Atlas DNS:       FAILED (${atlasHost}) — check network/connection string`);
        }
      }
    }
  }

  console.log(`  Gemini API:      ${env.GEMINI_API_KEY ? "CONFIGURED" : "NOT SET"}`);
  console.log(`  API Version:     1.0.0`);
  console.log(`  Node Env:         ${env.NODE_ENV}`);
  console.log(`  ─────────────────────────\n`);
}

async function bootstrap() {
  let mongoConnected = false;

  try {
    await connectMongoDB();
    mongoConnected = true;
    logger.info("MongoDB connected successfully", {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });
  } catch (error) {
    logger.error("MongoDB connection failed after retries — server will start without database", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  await runStartupDiagnostics(mongoConnected);

  if (mongoConnected) {
    try {
      await ensureAdminUser();
      logger.info("Admin user verified");
    } catch (error) {
      logger.error("Admin user setup failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    const geminiConfigured = !!env.GEMINI_API_KEY;
    const openaiConfigured = !!env.OPENAI_API_KEY;
    const aiProvider = geminiConfigured ? "Gemini" : openaiConfigured ? "OpenAI" : "Fallback (no API key)";

    console.log(`\n  Backend Running:  http://localhost:${env.PORT}`);
    console.log(`  CORS Origin:     ${env.CLIENT_URL}`);
    console.log(`  Gemini API:      ${geminiConfigured ? "LOADED" : "NOT SET"}`);
    console.log(`  AI Provider:     ${aiProvider}`);
    console.log(`  Health:          http://localhost:${env.PORT}/api/ai/health\n`);
    logger.info(`Server running on port ${env.PORT}`, {
      port: env.PORT,
      environment: env.NODE_ENV,
      mongoConnected,
    });
  });

  const shutdown = async (signal: string) => {
    logger.warn("Shutdown signal received", { signal });
    server.close(async () => {
      if (mongoConnected) await disconnectMongoDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  logger.error("Fatal server error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
