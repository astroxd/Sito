import { logger, redisClient } from "@anime-hub/common";
import { Request, Response, NextFunction } from "express";
import { IncomingMessage, ServerResponse } from "http";

/**
 * Options to configure Redis caching behavior for a proxy route.
 */
interface CacheOptions {
  /**
   * Time To Live (TTL) in seconds for the cached Redis key.
   * @default 86400 (24 hours)
   */
  ttl?: number;
}

const DEFAULT_TTL = 60 * 60 * 24;

/**
 * Factory function returning a response interceptor that writes JSON payloads to Redis on CACHE MISS.
 *
 * @param options - Configuration options of type {@link CacheOptions}.
 */
export const useCacheWrite = (options: CacheOptions = {}) => {
  const ttl = options.ttl ?? DEFAULT_TTL;

  return async (
    responseBuffer: Buffer,
    proxyRes: IncomingMessage,
    req: IncomingMessage,
    res: ServerResponse,
  ) => {
    const expressReq = req as unknown as Request;

    logger.info("[INTERCEPTOR] Intercepted response from target service!");

    const contentType = proxyRes.headers["content-type"] || "";
    if (
      proxyRes.statusCode === 200 &&
      contentType.includes("application/json")
    ) {
      const data = responseBuffer.toString("utf8");
      const cacheKey = `cache:${expressReq.originalUrl || expressReq.url}`;

      logger.info(`[REDIS] Caching key: ${cacheKey} (TTL: ${ttl}s)`);

      redisClient
        .setex(cacheKey, ttl, data)
        .then(() => logger.info("[REDIS] Saved successfully!"))
        .catch((err) => logger.error("Error saving to Redis:", err));
    }

    return responseBuffer;
  };
};

/**
 * Express middleware that checks Redis for cached data before reaching the target service.
 */
export const useCacheRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cacheKey = `cache:${req.originalUrl || req.url}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info("[CACHE HIT] Serving data from Redis!");
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(cachedData);
    }

    logger.info("[CACHE MISS] Key not found in Redis.");
  } catch (err) {
    logger.error("Redis Read Error:", err);
  }

  // Set MISS header when passing through to the backend service
  res.setHeader("X-Cache", "MISS");
  next();
};
