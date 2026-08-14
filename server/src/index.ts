import express from "express";
import path from "node:path";
import fs from "fs";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import "dotenv/config";

import globalRoutes from "./routes/index";
import { SharedListRole } from "./models/sharedList.model";
import { attachUserHeader } from "@anime-hub/common";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:8100", "http://localhost:3001"],
    methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use("/static", express.static(path.join(__dirname, "..", "static")));

declare global {
  namespace Express {
    interface Locals {
      userId: number;
      userRole: SharedListRole;
    }
  }
}

app.use(attachUserHeader);

app.get("/", (req, res) => {
  return res.send("Hello World!");
});

// const swaggerDocument = JSON.parse(
//   fs.readFileSync(path.join(__dirname, "swagger-output.json"), "utf8"),
// );

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/v1", globalRoutes);

const PORT = process.env.MONOLITH_PORT || 9999;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
