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

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();

// ─── Security & Core Middleware ───────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.disable("x-powered-by");
app.use(cors(corsOptions));
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser(env.COOKIE_SECRET));

// ─── NoSQL Injection Protection ───────────────────────────────────────────────

app.use(mongoSanitize());

// ─── Request Timeout ─────────────────────────────────────────────────────────

app.use(timeout("30s"));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

app.use(globalRateLimiter);

// ─── CSRF Protection ─────────────────────────────────────────────────────────

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  },
});

// ─── Health Check (MUST be before CSRF protection for Cloud Run) ─────────────
// Cloud Run health checks cannot provide CSRF tokens, so this must be unprotected.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// CSRF token endpoint (must come before protected routes)
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ success: true, csrfToken: req.csrfToken() });
});

// Apply CSRF protection to all API state-changing routes
app.use("/api", csrfProtection, routes);

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ─── Bootstrap ───────────────────────────────────────────────────────────────

/**
 * Cloud Run requires:
 *  1. Binding to 0.0.0.0 (not localhost/127.0.0.1)
 *  2. Listening on process.env.PORT (injected by Cloud Run at runtime)
 *  3. Server must be ready BEFORE the container health-check deadline (~10s)
 *
 * Strategy: bind the HTTP port immediately, then connect to MongoDB in the
 * background so Cloud Run can mark the container ready even if the database
 * takes longer to respond.
 */
const bootstrap = async (): Promise<void> => {
  // Cloud Run injects PORT at runtime; fall back to env schema default (5000) locally.
  const PORT = Number(process.env.PORT) || Number(env.PORT) || 8080;
  const HOST = "0.0.0.0"; // mandatory for Cloud Run – localhost won't accept external traffic

  logger.info("Starting ZENITH Fitness API...", {
    nodeEnv: env.NODE_ENV,
    port: PORT,
    host: HOST,
    nodeVersion: process.version,
  });

  const server = app.listen(PORT, HOST, () => {
    logger.info("✅ ZENITH Fitness API is live", {
      env: env.NODE_ENV,
      server: `http://${HOST}:${PORT}`,
      api: `http://${HOST}:${PORT}/api`,
      health: `http://${HOST}:${PORT}/api/health`,
    });
  });

  // Connect to MongoDB without blocking startup.
  void connectDB().catch((error) => {
    logger.error("MongoDB initialization failed after HTTP server started", {
      error,
    });
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────
  // Cloud Run sends SIGTERM before killing the container; drain in-flight requests.

  const shutdown = (signal: string) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info("HTTP server closed. Exiting.");
      process.exit(0);
    });

    // Force-exit after 10 s if graceful drain stalls (Cloud Run timeout is 10 s)
    setTimeout(() => {
      logger.error("Graceful shutdown timed out. Forcing exit.");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

// ─── Unhandled Rejection / Exception Guards ───────────────────────────────────
// Prevent silent crashes that leave Cloud Run in a broken state.

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection – forcing exit", { reason });
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception – forcing exit", { error: err.message, stack: err.stack });
  process.exit(1);
});

// ─── Start ────────────────────────────────────────────────────────────────────

bootstrap().catch((err) => {
  logger.error("Bootstrap failed – forcing exit", { error: err.message, stack: err.stack });
  process.exit(1);
});

export default app;
