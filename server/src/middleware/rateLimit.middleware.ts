import rateLimit from "express-rate-limit";

// Global rate limit: 100 requests per 15 minutes per IP
export const globalRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
});

// Auth-specific rate limit: 5 requests per 15 minutes per IP
export const authRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
});
