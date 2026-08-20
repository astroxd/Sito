import dotenv from "dotenv";
dotenv.config({
  path: ".env",
});
import pino from "pino";
import pinoHttp from "pino-http";

/**
 * Pino Log Levels (ascending order of priority):
 * `[trace, debug, info, warn, error, fatal]`
 *
 * Configured level sets the minimum threshold; only logs equal to or higher
 * priority than `process.env.LOG_LEVEL` (default: `"info"`) will be emitted.
 */

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  //   redact: ["req.headers.authorization", "req.headers.cookie"],
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} -> ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} -> ${res.statusCode} (${err.message})`,

  serializers: {
    req: () => undefined,
    res: () => undefined,
  },
  autoLogging: {
    ignore: (req) => req.method === "OPTIONS",
  },
});
