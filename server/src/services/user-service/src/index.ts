import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, "./config/.env"),
});

import express from "express";
import serviceRoutes from "./routes/index";
import cookieParser from "cookie-parser";
import { attachUserHeader, logger } from "@anime-hub/common";

const PORT = process.env.PORT || 3002;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachUserHeader);

app.get("/", (req, res) => {
  return res.send("Hello World");
});

app.use("/", serviceRoutes);

app.listen(PORT, () => {
  logger.info(`User Service is running on port ${PORT}`);
});
