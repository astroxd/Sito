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
  /**
   * Custom route prefix used to construct namespace-style Redis keys for visual folder grouping.
   * Internal slashes match the URL path, while colons `:` create virtual folders in Redis Insight.
   *
   * @example "/anime:details"  Transforms "/api/v1/anime/details/1333" into "cache:/api/v1/anime:details:1333:(1333)"
   */
  path?: string;
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

    logger.info(
      `[INTERCEPTOR] (${expressReq.originalUrl || expressReq.url}) Intercepted response from target service!`,
    );

    const contentType = proxyRes.headers["content-type"] || "";
    if (
      proxyRes.statusCode === 200 &&
      contentType.includes("application/json")
    ) {
      const data = responseBuffer.toString("utf8");

      const cacheKey = generateCacheKey(expressReq, options.path);

      // const cacheKey = `cache:${expressReq.originalUrl || expressReq.url}`;

      logger.info(`[REDIS] Caching key: ${cacheKey} (TTL: ${ttl}s)`);

      redisClient
        .setex(cacheKey, ttl, data)
        .then(() =>
          logger.info(
            `[REDIS] (${expressReq.originalUrl || expressReq.url}) Saved successfully!`,
          ),
        )
        .catch((err) => logger.error("Error saving to Redis:", err));
    }

    return responseBuffer;
  };
};

/**
 * Express middleware that checks Redis for cached data before reaching the target service.
 */
export const useCacheRead = (options: CacheOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // const cacheKey = `cache:${req.originalUrl || req.url}`;
    const cacheKey = generateCacheKey(req, options.path);

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.info(
          `[CACHE HIT] (${req.originalUrl || req.url}) Serving data from Redis!`,
        );
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Content-Type", "application/json");
        return res.status(200).send(cachedData);
      }

      logger.info(
        `[CACHE MISS] (${req.originalUrl || req.url}) Key not found in Redis.`,
      );
    } catch (err) {
      logger.error("Redis Read Error:", err);
    }

    // Set MISS header when passing through to the backend service
    res.setHeader("X-Cache", "MISS");
    next();
  };
};

/**
 * Generates an organized Redis cache key with folder-like namespacing for Redis GUI clients (e.g., Redis Insight).
 *
 * It transforms route base paths into custom prefixes, groups resource IDs into virtual folders,
 * converts sub-resource path slashes into namespace delimiters (`:`), and labels base resource calls as `(ID)`.
 *
 * @param req - The Express request object.
 * @param path - Optional custom path prefix (e.g., "/anime:details" or "anime:details").
 * @returns The fully formatted Redis key string prefixed with `cache:`.
 *
 * @example
 * GET /api/v1/anime/details/1333 -> "cache:/api/v1/anime:details:1333:(1333)"
 * GET /api/v1/anime/details/1333/recommendations -> "cache:/api/v1/anime:details:1333:recommendations"
 * GET /api/v1/anime/details/1333/characters/1 -> "cache:/api/v1/anime:details:1333:characters:1"
 */
export const generateCacheKey = (req: Request, path?: string): string => {
  // Strip query parameters from the request URL
  const fullUrl = (req.originalUrl || req.url).split("?")[0];

  let formattedUrl = fullUrl;

  // 1. Replace the base URL route segment with the custom path prefix if provided
  if (path) {
    const targetPrefix = path.startsWith("/") ? path : `/${path}`;
    const pathEquivalent = targetPrefix.replace(/:/g, "/");
    formattedUrl = fullUrl.replace(pathEquivalent, targetPrefix);
  }

  // 2. Transform the ID and all trailing sub-paths by converting slashes '/' into namespace delimiters ':'
  formattedUrl = formattedUrl.replace(/\/(\d+)(\/.*)?$/, (_, id, rest) => {
    // Base resource request (e.g., /anime:details/1333 -> :1333:(1333))
    if (!rest || rest === "/") {
      return `:${id}:(${id})`;
    }

    // Sub-resource request (e.g., /characters/1 -> :characters:1)
    const formattedRest = rest.replace(/\//g, ":");
    return `:${id}${formattedRest}`;
  });

  return `cache:${formattedUrl}`;
};
