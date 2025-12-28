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

  await mongoose.connect(env.MONGO_URI, {
    dbName: env.MONGO_DB_TEST,
  });
}

async function teardownTestDatabase(): Promise<void> {
  // const db = mongoose.connection.db;
  // if (!db || !db.databaseName || db.databaseName !== env.MONGO_DB_TEST) {
  //   throw new Error("Database name is not correct");
  // }

  // await db.dropDatabase();
  await mongoose.connection.close();
  await database.clearConnection();
}

// async function cleanupDatabase(): Promise<void> {
//   const db = mongoose.connection.db;
//   if (!db || !db.databaseName || db.databaseName !== env.MONGO_DB_TEST) {
//     throw new Error("Database name is not correct");
//   }

//   await db.dropDatabase();
// }

beforeAll(async () => {
  await setupTestDatabase();
});

afterEach(async () => {
  // await cleanupDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

export {
  // cleanupDatabase,
  setupTestDatabase,
  teardownTestDatabase,
};
