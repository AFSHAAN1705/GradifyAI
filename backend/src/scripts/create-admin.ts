import { connectMongoDB, disconnectMongoDB } from "../database/mongodb";
import { ADMIN_EMAIL, ADMIN_PASSWORD, ensureAdminUser } from "../services/admin-user.service";

async function seedAdmin() {
  try {
    console.log("Connecting MongoDB for admin seed...");
    await connectMongoDB();
    await ensureAdminUser();

    console.log("Admin account ready:");
    console.log("  Email:    " + ADMIN_EMAIL);
    console.log("  Password: " + ADMIN_PASSWORD);
    console.log("  Role:     ADMIN");
    console.log("\nLogin at: http://localhost:3000/admin/login");
    console.log("Dashboard: http://localhost:3000/admin\n");
  } catch (error) {
    console.error("Failed to seed admin:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await disconnectMongoDB();
  }
}

seedAdmin();
