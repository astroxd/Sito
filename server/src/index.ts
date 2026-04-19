import express from "express";
import Database from "better-sqlite3";
import cors from "cors";

import { execute, fetchAll, fetchFirst } from "./sql";
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:8100"],
    methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true,
  }),
);

const db = new Database("test.db");
db.pragma("journal_mode = WAL");

app.get("/", async (req, res) => {
  res.send("Hello World!");

  const stmt = db.prepare("SELECT * FROM User");
  const user = stmt.get();

  console.log(user);

  // const rows = await fetchAll(db, "SELECT * FROM User");
  // console.log(rows);
});

app.get("/user/:userId", async (req, res) => {
  const userId = req.params.userId;

  const stmt = db.prepare(
    "SELECT user_id, username, email FROM User WHERE user_id = ?",
  );
  const user = stmt.get(userId);

  console.log(user);
  res.send({ user: user });
  // const row = await fetchFirst(
  //   db,
  //   "SELECT user_id, username, email FROM User WHERE user_id = ?",
  //   [userId],
  // );
  // console.log(row);
  // res.send({ user: row });
});

// app.get("/list/:userId/entrie/:animeId", async (req, res) => {
//   const { userId, animeId } = req.params;

//   const row = await fetchFirst(
//     db,
//     "SELECT * FROM 'Private Anime' WHERE user_id = ? AND anime_id = ?",
//     [userId, animeId],
//   );
//   console.log(row);
//   if (row === undefined) {
//     res.send({ entrie: null });
//   } else {
//     res.send({ entrie: row });
//   }
// });

// app.post("/list/:userId/entrie", async (req, res) => {
//   const { userId } = req.params;
//   const { animeId, status } = req.body;

//   const query = await execute(
//     db,
//     "INSERT INTO 'Private Anime'(user_id,status,anime_id,added_on) VALUES(?,?,?, datetime('now'))",
//     [userId, status, animeId],
//   );

//   res.send({ message: "Added" });
// });

// app.patch("/list/:userId/entrie", async (req, res) => {
//   const { userId } = req.params;
//   const { animeId, status } = req.body;

//   const query = await execute(
//     db,
//     "UPDATE 'Private Anime' SET status = ? WHERE user_id = ? AND anime_id = ?",
//     [status, userId, animeId],
//   );
//   console.log("path", query);
//   res.send({ message: "Updated" });
// });

// app.delete("/list/:userId/entrie/:animeId", async (req, res) => {
//   const { userId, animeId } = req.params;
//   const query = await execute(
//     db,
//     "DELETE FROM 'Private Anime' WHERE user_id = ? AND anime_id = ?",
//     [userId, animeId],
//   );

//   res.send({ message: "Deleted" });
// });

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
