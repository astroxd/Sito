import express from "express";
import path from "node:path";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import globalRoutes from "./routes/index";
import { SharedListRole } from "./models/sharedList.model";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:8100"],
    methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use("/static", express.static(path.join(__dirname, "..", "static")));

// Source - https://stackoverflow.com/a/76266704
// Posted by wojtow
// Retrieved 2026-06-28, License - CC BY-SA 4.0

declare global {
  namespace Express {
    interface Locals {
      userId: number;
      userRole: SharedListRole;
    }
  }
}

app.get("/", (req, res) => {
  return res.send("Hello World!");
});

app.use("/", globalRoutes);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
