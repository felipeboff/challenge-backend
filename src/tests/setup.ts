import "../database/models/user.model";
import "../database/models/order.model";

import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

import { env } from "../config/env";
import { database } from "../database/database";

async function setupTestDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (database.getConnectionStatus()) {
    await database.clearConnection();
  }

  await mongoose.connect(env.MONGO_DB_TEST);

  console.log("✅ Connected to test database");
}

async function teardownTestDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }

  await mongoose.connection.close();

  await database.clearConnection();

  console.log("✅ Test database cleaned up and disconnected");
}

async function cleanupDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
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

export { cleanupDatabase, setupTestDatabase, teardownTestDatabase };
