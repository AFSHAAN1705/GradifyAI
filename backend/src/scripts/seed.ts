import { KCET_CATEGORIES } from "../config/constants";
import { connectMongoDB, disconnectMongoDB } from "../database/mongodb";
import { CategoryModel } from "../models/category.model";
import { logger } from "../utils/logger";

async function main() {
  await connectMongoDB();

  await Promise.all(
    KCET_CATEGORIES.map((category) =>
      CategoryModel.findOneAndUpdate(
        { code: category.code },
        { $set: { name: category.name, group: category.group, tags: category.tags } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  logger.info("Seeded KCET admission categories", { count: KCET_CATEGORIES.length });
}

main()
  .catch((error) => {
    logger.error("Seed failed", { error: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongoDB();
  });
