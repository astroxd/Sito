"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, "../config/.env"),
});
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const routes_1 = require("../routes");
const JTW_SECRET = process.env.JWT_SECRET || "RSAPRIVATE";
const isPublicRoute = (req) => {
    const fullPath = req.originalUrl.split("?")[0];
    return routes_1.PUBLIC_ROUTES.some((r) => fullPath === r.url);
};
const requireAuth = (req, res, next) => {
    if (isPublicRoute(req)) {
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. Missing token" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Access denied. Malformed token" });
    }
    try {
        const decodedToken = jsonwebtoken_1.default.verify(token, JTW_SECRET);
        req.headers["x-user-id"] = decodedToken.userId.toString();
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.requireAuth = requireAuth;
