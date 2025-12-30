import app from "./app";
import { env } from "./config/env";
import { database } from "./database/database";
import logger from "./shared/logger";

async function startServer() {
  try {
    await database.connect();

    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error("Error starting server", { error });
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  logger.warn("Shutting down server...");
  await database.disconnect();
  process.exit(0);
});

startServer();
