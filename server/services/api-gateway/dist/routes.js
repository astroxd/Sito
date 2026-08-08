"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupProxies = exports.PUBLIC_ROUTES = exports.ROUTES = void 0;
const http_proxy_middleware_1 = require("http-proxy-middleware");
const auth_middleware_1 = require("./middlewares/auth.middleware");
const express_rate_limit_1 = require("express-rate-limit");
const common_1 = require("@anime-hub/common");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: path_1.default.resolve(process.cwd(), ".env"),
});
const SERVICE_REGISTRY = {
    userService: process.env.USER_SERVICE_URL || "http://localhost:3002",
};
exports.ROUTES = [
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
exports.PUBLIC_ROUTES = [
    { url: "/api/v1/auth/register" },
    { url: "/api/v1/auth/login" },
    { url: "/api/v1/auth/refresh-token" },
    { url: "/api/v1/auth/test" },
];
const defaultGlobalLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * express_rate_limit_1.MINUTE,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (0, common_1.createRateLimitHandler)(),
});
const setupProxies = (app, routes) => {
    routes.forEach((r) => {
        if (r.auth) {
            app.use(r.url, auth_middleware_1.requireAuth);
        }
        if (r.rateLimit) {
            app.use(r.url, (0, express_rate_limit_1.rateLimit)(r.rateLimit));
        }
        else {
            app.use(r.url, defaultGlobalLimiter);
        }
        app.use(r.url, (0, http_proxy_middleware_1.createProxyMiddleware)(r.proxy));
    });
};
exports.setupProxies = setupProxies;
