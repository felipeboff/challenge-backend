import express from "express";

import cleanupMiddleware from "./middleware/cleanup.middleware";
import errorHandlerMiddleware from "./middleware/error-handler.middleware";
import authRouter from "./modules/auth/auth.router";
import orderRouter from "./modules/orders/order.router";
import authMiddleware from "./middleware/auth.middleware";

// Express application
const app = express();
const router = express.Router();

// Middleware to parse the request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to clean the request
app.use(cleanupMiddleware);

// Auth routes
router.use("/auth", authRouter);

// Auth middleware
router.use(authMiddleware);

// Order routes
router.use("/orders", orderRouter);

// API routes
app.use("/api", router);

// Error handler middleware
app.use(errorHandlerMiddleware);

export default app;
