import app from "./app";
import { env } from "./config/env";
import { database } from "./database/database";

// Connect to database when starting the application
async function startServer() {
  try {
    await database.connect();

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on("SIGINT", async () => {
  console.log("\n⚠️ Shutting down server...");
  await database.disconnect();
  process.exit(0);
});

startServer();
