"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, "./config/.env"),
});
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./routes");
const routes_2 = require("./routes");
const common_1 = require("@anime-hub/common");
const PORT = process.env.PORT || 3001;
const app = (0, express_1.default)();
app.use(common_1.httpLogger);
app.use((0, cors_1.default)({
    origin: ["http://localhost:8100"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    exposedHeaders: [
        "Retry-After",
        "RateLimit-Limit",
        "RateLimit-Remaining",
        "RateLimit-Reset",
        "RateLimit-Policy",
    ],
}));
(0, routes_2.setupProxies)(app, routes_1.ROUTES);
app.get("/hello", (req, res) => {
    return res.send("HELLO WORLD!");
});
app.listen(PORT, () => {
    common_1.logger.info(`Api Gateway is running on port ${PORT}`);
});
