import { RateLimitExceededEventHandler } from "express-rate-limit";
/**
 * Generates a reusable custom handler for express-rate-limit
 * @param routeName Optional name of the action to track in logs (e.g., 'login', 'global-proxy')
 */
export declare const createRateLimitHandler: (routeName?: string) => RateLimitExceededEventHandler;
//# sourceMappingURL=index.d.ts.map