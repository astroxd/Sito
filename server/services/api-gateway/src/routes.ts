import { createProxyMiddleware, Options } from "http-proxy-middleware";
import express from "express";
import { requireAuth } from "./middlewares/auth.middleware";
import {
  rateLimit,
  Options as RateLimitOptions,
  MINUTE,
  AugmentedRequest,
} from "express-rate-limit";
import { createRateLimitHandler, logger } from "@anime-hub/common";
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});
export interface ProxyRoute {
  url: string;
  auth: boolean;
  proxy: Options;
  rateLimit?: Partial<RateLimitOptions>;
}

const SERVICE_REGISTRY = {
  userService: process.env.USER_SERVICE_URL || "http://localhost:3002",
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
];

export const PUBLIC_ROUTES = [
  { url: "/api/v1/auth/register" },
  { url: "/api/v1/auth/login" },
  { url: "/api/v1/auth/refresh-token" },
  { url: "/api/v1/auth/test" },
];

const defaultGlobalLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: createRateLimitHandler(),
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

    app.use(r.url, createProxyMiddleware(r.proxy));
  });
};
