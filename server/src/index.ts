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
  res.send("Hello World!");

  const stmt = db.prepare("SELECT * FROM User");
  const user = stmt.get();

  console.log("USER: ", user);

  // const rows = await fetchAll(db, "SELECT * FROM User");
  // console.log(rows);
});

app.get("/user/:userId", (req, res) => {
  const userId = req.params.userId;

  const stmt = db.prepare(
    "SELECT user_id, username, email FROM User WHERE user_id = ?",
  );
  const user = stmt.get(userId);

  console.log("Get User: ", user);
  res.send({ user: user });
});

app.use("/", globalRoutes);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
