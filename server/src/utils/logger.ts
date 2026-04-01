import winston from "winston";
import { env } from "../config/env.js";

const { combine, timestamp, json, colorize, printf } = winston.format;

const developmentFormat = combine(
	colorize(),
	timestamp(),
	printf(({ level, message, timestamp, ...meta }) => {
		const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
		return `[${timestamp}] ${level}: ${message}${metaString}`;
	})
);

const productionFormat = combine(timestamp(), json());

export const logger = winston.createLogger({
	level: env.NODE_ENV === "production" ? "info" : "debug",
	format: env.NODE_ENV === "production" ? productionFormat : developmentFormat,
	transports: [new winston.transports.Console()],
});
