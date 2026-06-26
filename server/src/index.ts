import express from "express";
import path from "node:path";
import cors from "cors";
import cookieParser from "cookie-parser";
import db from "./config/database";
import "dotenv/config";

import globalRoutes from "./routes/index";

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

app.get("/", (req, res) => {
  return res.send("Hello World!");
});

app.use("/", globalRoutes);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
