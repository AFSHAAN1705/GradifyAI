import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model";
import { logger } from "../utils/logger";

export const ADMIN_EMAIL = "mafshaan1705@gmail.com";
export const ADMIN_PASSWORD = "Samra005";
export const ADMIN_NAME = "Admin";

export async function ensureAdminUser() {
  const existingAdmin = await UserModel.findOne({ email: ADMIN_EMAIL }).select("+passwordHash");

  if (!existingAdmin) {
    await UserModel.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: "ADMIN"
    });
    logger.info("Admin user created successfully", { email: ADMIN_EMAIL });
    return;
  }

  const passwordMatches = await bcrypt.compare(ADMIN_PASSWORD, existingAdmin.passwordHash);
  let changed = false;

  if (!passwordMatches) {
    existingAdmin.passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    changed = true;
  }

  if (existingAdmin.role !== "ADMIN") {
    existingAdmin.role = "ADMIN";
    changed = true;
  }

  if (!existingAdmin.name) {
    existingAdmin.name = ADMIN_NAME;
    changed = true;
  }

  if (changed) {
    await existingAdmin.save();
    logger.info("Admin user updated successfully", { email: ADMIN_EMAIL });
    return;
  }

  logger.info("Admin user already exists", { email: ADMIN_EMAIL });
}
