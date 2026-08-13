import {
  createRateLimitHandler,
  createRateLimitStore,
} from "@anime-hub/common";
import { Options, MINUTE, rateLimit, HOUR } from "express-rate-limit";

export const createRateLimit = (
  options: Partial<Options>,
  routeName?: string,
) => {
  return rateLimit({
    windowMs: options.windowMs ?? 1 * HOUR,
    limit: options.limit ?? 5,
    standardHeaders: options.standardHeaders ?? "draft-8",
    legacyHeaders: options.legacyHeaders ?? false,
    handler: options.handler ?? createRateLimitHandler(routeName),
    store: createRateLimitStore(
      routeName ? `rl:user-service:${routeName}` : "rl:user-service:global",
    ),
    ...options,
  });
};

export const loginLimiter = createRateLimit(
  {
    windowMs: 15 * MINUTE,
    limit: 5,
    skipSuccessfulRequests: true,
    handler: createRateLimitHandler("auth-login"),
  },
  "auth-login",
);
