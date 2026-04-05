import "../database/models/user.model";
import "../database/models/order.model";

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

import { env } from "../config/env";
import { database } from "../database/database";

let mongoMemoryServer: MongoMemoryServer | null = null;

async function setupTestDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (database.getConnectionStatus()) {
    await database.clearConnection();
  }

  mongoMemoryServer = await MongoMemoryServer.create({
    instance: {
      ip: "127.0.0.1",
      port: 27017,
      portGeneration: false,
    },
  });

  await mongoose.connect(mongoMemoryServer.getUri(), {
    dbName: env.MONGO_DB_TEST,
  });
}

async function cleanupDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) =>
      collection.deleteMany({})
    )
  );
}

async function teardownTestDatabase(): Promise<void> {
  await mongoose.connection.close();
  await database.clearConnection();
  await mongoMemoryServer?.stop();
  mongoMemoryServer = null;
}

beforeAll(async () => {
  await setupTestDatabase();
});

afterEach(async () => {
  await cleanupDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

export {
  cleanupDatabase,
  setupTestDatabase,
  teardownTestDatabase,
};
