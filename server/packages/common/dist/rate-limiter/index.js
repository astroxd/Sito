"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimitHandler = void 0;
const logger_1 = require("../logger");
/**
 * Generates a reusable custom handler for express-rate-limit
 * @param routeName Optional name of the action to track in logs (e.g., 'login', 'global-proxy')
 */
const createRateLimitHandler = (routeName) => {
    return (req, res, next, options) => {
        const augmentedReq = req;
        const msRemaining = augmentedReq.rateLimit?.resetTime
            ? augmentedReq.rateLimit.resetTime.getTime() - Date.now()
            : options.windowMs;
        const secondsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));
        const minutesRemaining = Math.ceil(secondsRemaining / 60);
        logger_1.logger.warn({
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            limit: options.limit,
            retryAfterSeconds: secondsRemaining,
        }, routeName
            ? `Rate limit exceeded for '${routeName}' from IP: ${req.ip}`
            : `Rate limit exceeded from IP: ${req.ip}`);
        res.status(options.statusCode).json({
            error: "Too Many Requests",
            message: `Too many attempts. Please try again in ${minutesRemaining} ${minutesRemaining === 1 ? "minute" : "minutes"}.`,
            retryAfterSeconds: secondsRemaining,
        });
    };
};
exports.createRateLimitHandler = createRateLimitHandler;
