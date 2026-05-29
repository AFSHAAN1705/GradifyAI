import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let connectionPromise: Promise<typeof mongoose> | null = null;

const mongoOptions: mongoose.ConnectOptions = {
  maxPoolSize: 20,
  minPoolSize: env.NODE_ENV === "production" ? 5 : 1,
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  retryWrites: true,
  autoIndex: env.NODE_ENV !== "production"
};

export async function connectMongoDB(attempt = 1): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    logger.info("Connecting to MongoDB", { attempt });
    connectionPromise = mongoose.connect(env.MONGODB_URI, mongoOptions);
  }

  try {
    const connection = await connectionPromise;
    logger.info("MongoDB connected successfully", {
      host: mongoose.connection.host,
      database: mongoose.connection.name
    });
    return connection;
  } catch (error) {
    connectionPromise = null;
    logger.error("MongoDB connection failed", {
      attempt,
      error: error instanceof Error ? error.message : String(error)
    });

    if (attempt >= 3) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
    return connectMongoDB(attempt + 1);
  }
}

export async function disconnectMongoDB() {
  await mongoose.disconnect();
}

mongoose.connection.on("connected", () => logger.info("MongoDB connected"));
mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));
mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
mongoose.connection.on("error", (error) =>
  logger.error("MongoDB runtime error", { error: error.message })
);
