// src/config/logger.js
// Pino logger singleton — openspec-constitution v2.1.0
//
// Production: structured JSON to stdout (CloudWatch compatible).
// Development (NODE_ENV=development): human-readable via pino-pretty transport.
//
// Usage:
//   import logger from "./config/logger.js"; // adjust relative path
//
// Per-request child logger (Lambda):
//   const reqLog = logger.child({ requestId: context.awsRequestId });

import pino from "pino";

const isDev = process.env.NODE_ENV === "development";
const level = process.env.LOG_LEVEL ?? (isDev ? "debug" : "info");

const logger = pino({
  level,
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
  base: {
    service: process.env.npm_package_name ?? "service",
  },
  redact: {
    paths: [
      "*.password",
      "*.token",
      "*.secret",
      "*.authorization",
      "*.apiKey",
      "*.privateKey",
    ],
    censor: "[REDACTED]",
  },
});

export default logger;
