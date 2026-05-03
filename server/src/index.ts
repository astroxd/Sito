import express from "express";
import Database, { RunResult, SqliteError } from "better-sqlite3";
import cors from "cors";

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

  console.log("USER: ", user);

  // const rows = await fetchAll(db, "SELECT * FROM User");
  // console.log(rows);
});

app.get("/user/:userId", async (req, res) => {
  const userId = req.params.userId;

  const stmt = db.prepare(
    "SELECT user_id, username, email FROM User WHERE user_id = ?",
  );
  const user = stmt.get(userId);

  console.log("Get User: ", user);
  res.send({ user: user });
});

app.get("/list/:userId/entrie/:animeId", (req, res) => {
  const { userId, animeId } = req.params;

  const stmt = db.prepare(
    "SELECT * FROM 'Private Anime' WHERE user_id = ? AND anime_id = ?",
  );
  const row = stmt.get(userId, animeId);

  console.log("ROW: ", row);
  if (row === undefined) {
    res.send({ entrie: null });
  } else {
    res.send({ entrie: row });
  }
});

app.post("/list/:userId/entrie", (req, res) => {
  const { userId } = req.params;
  const { animeId, status, animeDetails } = req.body;
  if (!animeId || !status || !animeDetails) {
    res.send({ error: "Error on add" });
    return;
  }
  const { id, idMal, title, coverImage, episodes, duration } = animeDetails;
  console.log(episodes);
  try {
    db.transaction(() => {
      const animeUpsert = db
        .prepare(
          `INSERT INTO Anime (anime_id, anime_mal_id, anime_title, anime_cover, anime_episodes, anime_avg_episode_duration) VALUES(?, ?, ?, ?, ?, ?)
      ON CONFLICT (anime_id)
      DO UPDATE SET anime_title = @title, anime_cover = @cover, anime_episodes = @episodes, anime_avg_episode_duration = @duration`,
        )
        .run(id, idMal, title, coverImage, episodes, duration, {
          title: title,
          cover: coverImage,
          episodes: episodes,
          duration: duration,
        });
      console.log("Anime Upsert: ", animeUpsert);

      const res = db
        .prepare(
          "INSERT INTO 'Private Anime'(user_id,status,anime_id,added_on) VALUES(?,?,?, datetime('now'))",
        )
        .run(userId, status, animeId);
      console.log("Private Anime: ", res);
    })();
    res.send({ message: "Added" });
    return;
  } catch (error) {
    console.log(error);
  }
  res.send({ error: "Error on add" });
});

app.patch("/list/:userId/entrie", async (req, res) => {
  const { userId } = req.params;
  const { animeId, status } = req.body;

  try {
    const stmt = db
      .prepare(
        "UPDATE 'Private Anime' SET status = ? WHERE user_id = ? AND anime_id = ?",
      )
      .run(status, userId, animeId);

    res.send({ message: "Updated" });
    return;
  } catch (error) {
    console.log(error);
  }
  res.send({ error: "Error on update" });
});

app.delete("/list/:userId/entrie/:animeId", (req, res) => {
  const { userId, animeId } = req.params;

  try {
    const stmt = db
      .prepare("DELETE FROM 'Private Anime' WHERE user_id = ? AND anime_id = ?")
      .run(userId, animeId);

    res.send({ message: "Deleted" });
    return;
  } catch (error) {
    console.log(error);
  }
  res.send({ error: "Error on delete" });
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
