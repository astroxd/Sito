import {
  createProxyMiddleware,
  Options,
  responseInterceptor,
} from "http-proxy-middleware";
import express, { Request, Response, RequestHandler } from "express";
import { requireAuth } from "./middlewares/auth.middleware";
import { rateLimit, Options as RateLimitOptions } from "express-rate-limit";
import {
  createRateLimitHandler,
  createRateLimitStore,
} from "@anime-hub/common";
import path from "path";
import dotenv from "dotenv";
import { useCacheWrite, useCacheRead } from "./middlewares/cache.middleware";
import { IncomingMessage, ServerResponse } from "http";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

/**
 * Redis cache configuration for a proxy route.
 */
export interface CacheOptions {
  /**
   * Toggle caching. If `false`, caching is bypassed even if handlers are defined.
   */
  enabled: boolean;

  /**
   * Time To Live (TTL) in seconds for the cached Redis key.
   */
  ttl: number;

  /**
   * Express middleware executed **BEFORE** the request hits the underlying service.
   * Checks Redis for cached data to serve on CACHE HIT.
   * @default {@link useCacheRead}
   */
  onReq?: RequestHandler;

  /**
   * Interceptor executed **AFTER** the underlying service completes the response.
   * Saves the response buffer into Redis on CACHE MISS.
   * @default {@link useCacheWrite | useCacheWrite()}
   */
  onRes?: (
    responseBuffer: Buffer,
    proxyRes: IncomingMessage,
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<string | Buffer>;
}

export interface ProxyRoute {
  url: string;
  auth: boolean;
  cache?: CacheOptions;
  proxy: Options;
  rateLimit?: Partial<RateLimitOptions>;
}

const SERVICE_REGISTRY = {
  userService: process.env.USER_SERVICE_URL || "http://localhost:3002",
  monolith: process.env.MONOLITH_URL || "http://localhost:9999",
};

export const ROUTES: ProxyRoute[] = [
  {
    url: "/api/v1/auth",
    auth: true,
    proxy: {
      target: SERVICE_REGISTRY.userService,
      changeOrigin: true,
      pathRewrite: {
        "^/": "/auth/",
      },
    },
  },
  {
    url: "/api/v1/user",
    auth: true,
    proxy: {
      target: SERVICE_REGISTRY.userService,
      changeOrigin: true,
      pathRewrite: {
        "^/": "/user/",
      },
    },
  },
  {
    url: "/api/v1/anime/details",
    auth: true,
    cache: {
      enabled: true,
      ttl: 60 * 60 * 24,
      // onRes: useCache(),
      // onReq: useCacheRead,
    },

    proxy: {
      target: SERVICE_REGISTRY.monolith,
      changeOrigin: true,
      pathRewrite: {
        "^/": "/api/v1/anime/details/",
      },
    },
  },
  {
    url: "/api/v1/anime",
    auth: true,
    proxy: {
      target: SERVICE_REGISTRY.monolith,
      changeOrigin: true,
      pathRewrite: {
        "^/": "/api/v1/anime/",
      },
    },
  },
  {
    url: "/api/v1/",
    auth: true,
    proxy: {
      target: SERVICE_REGISTRY.monolith,
      changeOrigin: true,
      pathRewrite: {
        "^/": "/api/v1/",
      },
    },
  },
];

export const PUBLIC_ROUTES = [
  { url: "/api/v1/auth/register" },
  { url: "/api/v1/auth/login" },
  { url: "/api/v1/auth/refresh-token" },
];

const defaultGlobalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: createRateLimitHandler(),
  store: createRateLimitStore("rl:gateway:global"),
});

export const setupProxies = (app: express.Express, routes: ProxyRoute[]) => {
  routes.forEach((r) => {
    if (r.auth) {
      app.use(r.url, requireAuth);
    }

    if (r.rateLimit) {
      app.use(r.url, rateLimit(r.rateLimit));
    } else {
      app.use(r.url, defaultGlobalLimiter);
    }

    let proxyOptions = { ...r.proxy };

    if (r.cache?.enabled) {
      const handleReq = r.cache.onReq ?? useCacheRead;

      app.use(r.url, handleReq);

      const handleRes = r.cache.onRes ?? useCacheWrite({ ttl: r.cache.ttl });

      proxyOptions = {
        ...proxyOptions,
        selfHandleResponse: true,
        on: {
          ...proxyOptions.on,
          proxyRes: responseInterceptor(handleRes),
        },
      };
    }

    app.use(r.url, createProxyMiddleware<Request, Response>(proxyOptions));
  });
};

//TODO add caching
