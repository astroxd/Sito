"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || "info",
    transport: process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
                ignore: "pid,hostname",
            },
        }
        : undefined,
});
exports.httpLogger = (0, pino_http_1.default)({
    logger: exports.logger,
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err)
            return "error";
        if (res.statusCode >= 400)
            return "warn";
        return "info";
    },
    //   redact: ["req.headers.authorization", "req.headers.cookie"],
    customSuccessMessage: (req, res) => `${req.method} ${req.url} -> ${res.statusCode}`,
    customErrorMessage: (req, res, err) => `${req.method} ${req.url} -> ${res.statusCode} (${err.message})`,
    serializers: {
        req: () => undefined,
        res: () => undefined,
    },
    autoLogging: {
        ignore: (req) => req.method === "OPTIONS",
    },
});
