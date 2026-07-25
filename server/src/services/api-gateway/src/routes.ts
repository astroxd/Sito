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
  // userService: "https://www.google.com",
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
      on: {
        proxyReq: (proxyReq, req, res) => {
          console.log(
            `[PROXY] Inoltro da ${req.url} -> ${SERVICE_REGISTRY.userService}${proxyReq.path}`,
          );
        },
        proxyRes: (proxyRes, req, res) => {
          console.log(`[PROXY] Risposta dal servizio: ${proxyRes.statusCode}`);
        },
        error: (err, req, res) => {
          console.error(`[PROXY ERROR]`, err);
        },
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

export const setupProxies = (app: express.Express, routes: ProxyRoute[]) => {
  routes.forEach((r) => {
    if (r.auth) {
      app.use(r.url, requireAuth);
    }
    app.use(r.url, createProxyMiddleware(r.proxy));
  });
};
