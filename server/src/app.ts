import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import mongoSanitize from "express-mongo-sanitize";
import timeout from "connect-timeout";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { corsOptions } from "./config/cors.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { globalRateLimiter } from "./middleware/rateLimit.middleware.js";
import routes from "./routes/index.js";
import { logger } from "./utils/logger.js";

const app = express();

// Connect to database
connectDB();

// Security & core middleware
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.disable("x-powered-by");
app.use(cors(corsOptions));
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser(env.COOKIE_SECRET));

// NoSQL injection protection
app.use(mongoSanitize());

// Request timeout (30 seconds)
app.use(timeout("30s"));

// Global rate limiter
app.use(globalRateLimiter);

// CSRF protection (cookie-based)
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
  },
});

// CSRF token route (must be before CSRF protection on other routes)
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken(),
  });
});

// Apply CSRF protection to state-changing routes
app.use("/api", csrfProtection, routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = parseInt(env.PORT);
app.listen(PORT, () => {
  logger.info("ZENITH Fitness API Server started", {
    env: env.NODE_ENV,
    server: `http://localhost:${PORT}`,
    api: `http://localhost:${PORT}/api`,
    health: `http://localhost:${PORT}/api/health`,
  });
});

export default app;
