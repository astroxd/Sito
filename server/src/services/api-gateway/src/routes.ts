import { createProxyMiddleware, Options } from "http-proxy-middleware";
import express from "express";
import { requireAuth } from "./middlewares/auth.middleware";

export interface ProxyRoute {
  url: string;
  auth: boolean;
  proxy: Options;
}

const SERVICE_REGISTRY = {
  userService: "http://localhost:3002",
};

export const ROUTES: ProxyRoute[] = [
  {
    url: "/api/v1/auth",
    auth: true,
    proxy: {
      target: SERVICE_REGISTRY.userService,
      changeOrigin: true,
      pathRewrite: {
        [`^/api/v1/auth`]: "/auth",
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
        [`^/api/v1/user`]: "/user",
      },
    },
  },
];

export const PUBLIC_ROUTES = [
  { url: "/api/v1/auth/register" },
  { url: "/api/v1/auth/login" },
  { url: "/api/v1/auth/refresh-token" },
];

export const setupProxies = (app: express.Express, routes: ProxyRoute[]) => {
  routes.forEach((r) => {
    if (r.auth) {
      app.use(r.url, requireAuth);
    }
    app.use(r.url, createProxyMiddleware(r.proxy));
  });
};
