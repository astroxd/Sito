import { Request, Response, NextFunction } from "express";
import {
  AugmentedRequest,
  Options,
  RateLimitExceededEventHandler,
} from "express-rate-limit";
import { logger } from "../logger";

/**
 * Generates a reusable custom handler for express-rate-limit
 * @param routeName Optional name of the action to track in logs (e.g., 'login', 'global-proxy')
 */
export const createRateLimitHandler = (
  routeName?: string,
): RateLimitExceededEventHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
    options: Options,
  ) => {
    const augmentedReq = req as AugmentedRequest;

    const msRemaining = augmentedReq.rateLimit?.resetTime
      ? augmentedReq.rateLimit.resetTime.getTime() - Date.now()
      : options.windowMs;
    const secondsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));
    const minutesRemaining = Math.ceil(secondsRemaining / 60);

    logger.warn(
      {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        limit: options.limit,
        retryAfterSeconds: secondsRemaining,
      },
      routeName
        ? `Rate limit exceeded for '${routeName}' from IP: ${req.ip}`
        : `Rate limit exceeded from IP: ${req.ip}`,
    );

    res.status(options.statusCode).json({
      error: "Too Many Requests",
      message: `Too many attempts. Please try again in ${minutesRemaining} ${minutesRemaining === 1 ? "minute" : "minutes"}.`,
      retryAfterSeconds: secondsRemaining,
    });
  };
};
