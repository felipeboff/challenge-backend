import express from "express";

import { authMiddleware } from "./middleware/auth.middleware";
import { cleanupMiddleware } from "./middleware/cleanup.middleware";
import { ErrorHandlerMiddleware } from "./middleware/error-handler.middleware";
import authRouter from "./modules/auth/auth.router";
import orderRouter from "./modules/orders/order.router";

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
app.use(ErrorHandlerMiddleware);

export default app;
