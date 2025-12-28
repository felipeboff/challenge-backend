import "./models/user.model";
import "./models/order.model";

import mongoose from "mongoose";

import { env } from "../config/env";

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
      console.log("Database is already connected");
      return;
    }

    try {
      const databaseName =
        env.NODE_ENV === "development"
          ? env.MONGO_DB_DEVELOPMENT
          : env.MONGO_DB_PRODUCTION;

      await mongoose.connect(env.MONGO_URI, {
        dbName: databaseName,
      });
      this.isConnected = true;
      console.log("✅ Successfully connected to MongoDB");

      this.setupConnectionEvents();
    } catch (error) {
      console.error("❌ Error connecting to MongoDB:", error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      console.log("Database is already disconnected");
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log("✅ Successfully disconnected from MongoDB");
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error);
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
      console.error("❌ MongoDB connection error:", error);
      this.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
      this.isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
      this.isConnected = true;
    });

    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected");
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
