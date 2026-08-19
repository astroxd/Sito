import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, "./config/.env"),
});

import express from "express";
import serviceRoutes from "./routes/index";
import { attachUserHeader, logger } from "@anime-hub/common";

const PORT = process.env.PORT || 3003;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachUserHeader);

app.get("/", (req, res) => {
  res.send("Hello World from anime-service");
});

app.use("/", serviceRoutes);

app.listen(PORT, () => {
  logger.info(`anime-service is running on port ${PORT}`);
});
