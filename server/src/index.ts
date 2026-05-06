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
db.pragma("foreign_keys = ON");

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

      db.prepare(
        "INSERT INTO 'Watched Episodes'(user_id, anime_id) VALUES(?,?)",
      ).run(userId, animeId);
    })();
    res.send({ message: "Added" });
    return;
  } catch (error) {
    console.log(error);
  }
  res.send({ error: "Error on add" });
});

app.patch("/list/:userId/entrie", (req, res) => {
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
    db.transaction(() => {
      const stmt = db
        .prepare(
          "DELETE FROM 'Private Anime' WHERE user_id = ? AND anime_id = ?",
        )
        .run(userId, animeId);

      db.prepare(
        "DELETE FROM 'Watched Episodes' WHERE user_id = ? AND anime_id = ?",
      ).run(userId, animeId);
    })();

    res.send({ message: "Deleted" });
    return;
  } catch (error) {
    console.log(error);
  }
  res.send({ error: "Error on delete" });
});

app.get("/lists/:userId/:status", (req, res, next) => {
  if (req.query) {
    next();
    return;
  }

  const { userId, status } = req.params;
  if (!userId || !status) {
    res.send({ error: "Error missing params" });
    return;
  }

  const list = db
    .prepare(
      `SELECT * FROM 'Private Anime' p
    INNER JOIN Anime ON Anime.anime_id = p.anime_id
    INNER JOIN 'Watched Episodes' w ON w.anime_id = p.anime_id 
    WHERE p.user_id = ? AND p.status = ?`,
    )
    .all(userId, status);
  // console.log(list);

  res.send({ data: list });
});
app.get("/lists/:userId/:status/:page", (req, res) => {
  const { userId, status, page } = req.params;
  if (!userId || !status || !page) {
    res.send({ error: "Error missing params" });
    return;
  }

  const perPage = 3;
  const offset = (parseInt(page) - 1) * perPage;

  const list: any = db
    .prepare(
      `SELECT *, COUNT(*) OVER() AS length FROM 'Private Anime' p
    INNER JOIN Anime ON Anime.anime_id = p.anime_id
    INNER JOIN 'Watched Episodes' w ON w.anime_id = p.anime_id
    WHERE p.user_id = ? AND p.status = ?
    LIMIT ?
    OFFSET ?`,
    )
    .all(userId, status, perPage, offset);
  console.log(list);

  let hasNextPage = false;

  if (list.length > 0) {
    hasNextPage = list[0]["length"] > parseInt(page) * perPage;
  }

  res.send({ data: list, page: parseInt(page), perPage: perPage, hasNextPage });
});

app.get("/lists/:userId/:status", (req, res) => {
  const { userId, status } = req.params;
  if (!userId || !status) {
    res.send({ error: "Error missing params" });
    return;
  }
  const { q, page } = req.query;
  const p = parseInt((page as string) ?? 1);
  console.log("query ", q, page);
  const perPage = 3;
  const offset = (p - 1) * perPage;

  const list: any = db
    .prepare(
      `SELECT *, COUNT(*) OVER() AS length FROM 'Private Anime' p
    INNER JOIN Anime ON Anime.anime_id = p.anime_id
    INNER JOIN 'Watched Episodes' w ON w.anime_id = p.anime_id 
    WHERE p.user_id = ? AND p.status = ? AND Anime.anime_title COLLATE UTF8_GENERAL_CI LIKE @query
    LIMIT ? 
    OFFSET ?`,
    )
    .all(userId, status, perPage, offset, { query: String(q) + "%" });
  console.log(list);

  let hasNextPage = false;

  if (list.length > 0) {
    hasNextPage = list[0]["length"] > p * perPage;
  }

  res.send({ data: list, page: p, perPage: perPage, hasNextPage });
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
