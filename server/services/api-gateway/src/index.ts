import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, "./config/.env"),
});

import express from "express";
import cors from "cors";
import { ROUTES } from "./routes";
import { setupProxies } from "./routes";
import { httpLogger, logger } from "@anime-hub/common";

const PORT = process.env.PORT || 3001;

const app = express();
// app.use(httpLogger);

app.use(
  cors({
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
  }),
);

setupProxies(app, ROUTES);

app.get("/hello", (req, res) => {
  return res.send("HELLO WORLD!");
});

app.listen(PORT, () => {
  logger.info(`Api Gateway is running on port ${PORT}`);
});
