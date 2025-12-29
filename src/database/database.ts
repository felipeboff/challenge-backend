import "./models/user.model";
import "./models/order.model";

import mongoose from "mongoose";

import { env } from "../config/env";
import { logger } from "../shared/logger";

export class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.debug("Database is already connected");
      return;
    }

    const databaseName =
      env.NODE_ENV === "development"
        ? env.MONGO_DB_DEVELOPMENT
        : env.MONGO_DB_PRODUCTION;

    try {
      await mongoose.connect(env.MONGO_URI, {
        dbName: databaseName,
      });
      this.isConnected = true;
      logger.info("Successfully connected to MongoDB", {
        details: {
          database: databaseName,
        },
      });

      this.setupConnectionEvents();
    } catch (error) {
      logger.error("Error connecting to MongoDB", {
        details: {
          database: databaseName,
        },
        error,
      });
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.debug("Database is already disconnected");
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info("Successfully disconnected from MongoDB");
    } catch (error) {
      logger.error("Error disconnecting from MongoDB", { error });
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnection(): typeof mongoose.connection {
    return mongoose.connection;
  }

  private setupConnectionEvents(): void {
    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error", error);
      this.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
      this.isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
      this.isConnected = true;
    });

    mongoose.connection.on("connected", () => {
      logger.info("MongoDB connected");
      this.isConnected = true;
    });
  }

  public async clearConnection(): Promise<void> {
    if (this.isConnected) {
      await this.disconnect();
    }
    Database.instance = undefined as unknown as Database;
  }
}

export const database = Database.getInstance();
