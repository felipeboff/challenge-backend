import express from "express";
import authRouter from "./modules/auth/auth.router";
import {
  authMiddleware,
  authMiddlewareCleaner,
} from "./middleware/auth.middleware";

// Express application
const app = express();
const router = express.Router();

// Middleware to parse the request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to clean the auth context
app.use(authMiddlewareCleaner);

// Auth routes (public - no authentication required)
router.use(authRouter);

// Auth middleware (protects routes below this point)
router.use(authMiddleware);

// API routes
app.use("/api", router);

export default app;
