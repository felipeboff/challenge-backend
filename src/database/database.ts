import mongoose from "mongoose";
import { env } from "../config/env";

export class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  /**
   * Gets the unique instance of the Database class (Singleton)
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Connects to the MongoDB database
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log("Database is already connected");
      return;
    }

    try {
      await mongoose.connect(env.MONGO_URI);
      this.isConnected = true;
      console.log("✅ Successfully connected to MongoDB");

      // Setup connection events
      this.setupConnectionEvents();
    } catch (error) {
      console.error("❌ Error connecting to MongoDB:", error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnects from the MongoDB database
   */
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

  /**
   * Checks if connected to the database
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Gets the Mongoose connection instance
   */
  public getConnection(): typeof mongoose.connection {
    return mongoose.connection;
  }

  /**
   * Sets up MongoDB connection events
   */
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

  /**
   * Clears the connection (useful for tests)
   */
  public async clearConnection(): Promise<void> {
    if (this.isConnected) {
      await this.disconnect();
    }
    Database.instance = null as any;
  }
}

// Exports a unique instance for direct use
export const database = Database.getInstance();
