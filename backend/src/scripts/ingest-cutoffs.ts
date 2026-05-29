import fs from "node:fs/promises";
import path from "node:path";
import { connectMongoDB, disconnectMongoDB } from "../database/mongodb";
import { ingestCutoffPdf } from "../services/pdf-ingestion.service";
import { logger } from "../utils/logger";

async function main() {
  await connectMongoDB();

  const dataDir = path.resolve(process.cwd(), "data");
  const rootDir = path.resolve(process.cwd(), "..");
  const candidates = [
    ...(await fs.readdir(dataDir).catch(() => [])).map((file) => path.join(dataDir, file)),
    ...(await fs.readdir(rootDir).catch(() => [])).map((file) => path.join(rootDir, file))
  ].filter((file) => /Round CutOff 2025\.pdf$/i.test(path.basename(file)));

  if (!candidates.length) {
    throw new Error("No cutoff PDFs were found in backend/data or the repository root.");
  }

  const results = [];
  for (const filePath of candidates.sort()) {
    results.push(
      await ingestCutoffPdf({
        filePath,
        originalName: path.basename(filePath)
      })
    );
  }

  console.table(results);
}

main()
  .catch((error) => {
    logger.error("Cutoff ingestion failed", {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongoDB();
  });
