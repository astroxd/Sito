import express from "express";
import Database, { RunResult, SqliteError } from "better-sqlite3";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { access } from "node:fs";

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

// app.get("/lists/:userId/:status", (req, res, next) => {
//   console.log("PROVAA");
//   if (req.query) {
//     next();
//     return;
//   }

//   const { userId, status } = req.params;
//   if (!userId || !status) {
//     res.send({ error: "Error missing params" });
//     return;
//   }

//   const list = db
//     .prepare(
//       `SELECT * FROM 'Private Anime' p
//     INNER JOIN Anime ON Anime.anime_id = p.anime_id
//     INNER JOIN 'Watched Episodes' w ON w.anime_id = p.anime_id
//     WHERE p.user_id = ? AND p.status = ?`,
//     )
//     .all(userId, status);
//   // console.log(list);

//   res.send({ data: list });
// });
app.get("/lists/:userId/:status/:page", (req, res) => {
  const { userId, status, page } = req.params;
  if (!userId || !status || !page) {
    res.send({ error: "Error missing params" });
    return;
  }

  const perPage = 6;
  const offset = (parseInt(page) - 1) * perPage;

  const list: any = db
    .prepare(
      `SELECT *, COUNT(*) OVER() AS length FROM 'Private Anime' p
    INNER JOIN Anime ON Anime.anime_id = p.anime_id
    INNER JOIN 'Watched Episodes' w ON w.anime_id = p.anime_id AND w.user_id = p.user_id
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
  const perPage = 6;
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

app.get("/shared-lists/:userId", (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    res.send({ error: "Error missing params" });
    return;
  }

  try {
    let sharedListsInfo: any[] = [];

    const sharedLists = db
      .prepare(
        `
      SELECT * FROM 'Shared List' l
      INNER JOIN 'Shared List User' u ON l.shared_list_id = u.shared_list_id
      WHERE u.user_id = ?`,
      )
      .all(userId);
    console.log(sharedLists);

    const sharedUsersStmt = db.prepare(
      `SELECT User.user_id, User.avatar, User.username, u.role, IFNULL(SUM(p.current_episode), 0) as total_episodes, COUNT(*) OVER() AS length 
      FROM 'Shared List User' u
      LEFT JOIN 'Shared List Progress' p ON p.user_id = u.user_id AND p.shared_list_id = u.shared_list_id 
      INNER JOIN 'User' ON User.user_id = u.user_id
      WHERE u.shared_list_id = ?
      GROUP BY u.user_id
      ORDER BY total_episodes
      LIMIT 5`,
    );
    sharedLists.forEach((list: any) => {
      sharedListsInfo.push({
        sharedList: list,
        members: sharedUsersStmt.all(list.shared_list_id),
      });
    });

    res.send({ data: sharedListsInfo });
    return;
  } catch (error) {
    console.log(error);
  }
});

// app.get("/shared-list/:userId/:listId/users", (req,res)=>{

//     const sharedUsersStmt = db.prepare(
//       `SELECT * FROM 'Shared List User'
//       WHERE shared_list_id = ?`,
//     );
//     sharedLists.forEach((list: any) => {
//       sharedListUsers.push(sharedUsersStmt.all(list.shared_list_id));
//     });

//     console.log(sharedListUsers);
// })

//* Informazioni lista specifica, chiamata quando carica shared-list.page
app.get("/shared-list/:userId/:listId", (req, res) => {
  const { userId, listId } = req.params;
  if (!listId) {
    res.send({ error: "Missing params" });
    return;
  }

  try {
    const data = db
      .prepare(
        `
      SELECT * FROM 'Shared List' l
      INNER JOIN 'Shared List User' u ON l.shared_list_id = u.shared_list_id
      WHERE l.shared_list_id = ? AND u.user_id = ?
      `,
      )
      .get(listId, userId);

    console.log(data);

    res.send({ data: data });
    return;
  } catch (error) {
    console.log(error);
  }
});

//* Ottiene i progressi per ogni anime del singolo utente della lista
app.get("/shared-list/:userId/:listId/animes", (req, res) => {
  const { userId, listId } = req.params;

  if (!userId || !listId) {
    res.send({ error: "Missing params" });
    return;
  }

  try {
    //  SELECT * FROM 'Shared List Anime' sa
    //     LEFT JOIN 'Shared List Progress' p ON p.shared_list_id = sa.shared_list_id  AND p.user_id = @userId
    //     JOIN 'Anime' a ON a.anime_id = sa.anime_id
    //     WHERE sa.shared_list_id = @listId
    const userProgress = db
      .prepare(
        `
        SELECT *, sa.shared_list_id FROM 'Shared List Anime' sa
        LEFT JOIN 'Shared List Progress' p ON p.shared_list_id = sa.shared_list_id
          AND p.anime_id = sa.anime_id AND p.user_id = @userId
        JOIN 'Anime' a ON a.anime_id = sa.anime_id
        WHERE sa.shared_list_id = @listId
        ORDER BY p.updated_at DESC
      `,
      )
      .all({ listId, userId });

    console.log(userProgress);

    res.send({ data: userProgress });
  } catch (error) {
    console.log(error);
  }
});

//* Ottiene i progressi per ogni anime per ogni utente della lista
app.get("/shared-list/:userId/:listId/animes/all", (req, res) => {
  const { userId, listId } = req.params;

  if (!userId || !listId) {
    res.send({ error: "Missing params" });
    return;
  }

  try {
    const sharedListAnimes = db
      .prepare(
        `
        SELECT * FROM 'Shared List Anime' sa
        INNER JOIN 'Anime' a ON a.anime_id = sa.anime_id
        WHERE sa.shared_list_id = @listId
      `,
      )
      .all({ listId });

    console.log(sharedListAnimes);
    let sharedListProgress: any[] = [];
    sharedListAnimes.forEach((anime: any) => {
      const animeProgress = db
        .prepare(
          `SELECT * FROM 'Shared List Progress' p
          INNER JOIN 'Shared List User' u  ON u.shared_list_id = p.shared_list_id AND u.user_id = p.user_id
          INNER JOIN 'User' ON User.user_id = u.user_id
          WHERE p.anime_id = @animeId
          ORDER BY p.current_episode DESC
          `,
        )
        .all({ animeId: anime.anime_id });

      sharedListProgress.push({
        anime: anime,
        progress: animeProgress,
      });
    });

    res.send({ data: sharedListProgress });
  } catch (error) {
    console.log(error);
  }
});

//* Ritorna tutte le liste condivise dell'utente
//* se l'anime è presente il campo "anime_id" !== null
//* se l'anime non è presente il campo "anime_id" === null
app.get("/shared-list/:userId/entrie/:animeId", (req, res) => {
  const { userId, animeId } = req.params;

  if (!userId || !animeId) {
    res.send({ error: "Missing params" });
    return;
  }
  try {
    const sharedLists = db
      .prepare(
        `
        SELECT * FROM 'Shared List' l
        LEFT JOIN 'Shared List Anime' a ON a.shared_list_id = l.shared_list_id AND a.anime_id = ?
        LEFT JOIN 'Shared List User' u ON u.shared_list_id = l.shared_list_id
        WHERE u.user_id = ?`,
      )
      .all(animeId, userId);

    console.log(sharedLists);
    res.send({ data: sharedLists });
    return;
  } catch (error) {
    console.log(error);
  }
});

//* Aggiungi anime a lista condivisa
app.post("/shared-list/:userId/:listId/entrie", (req, res) => {
  const { userId, listId } = req.params;
  const { animeDetails } = req.body;

  if (!userId || !listId) {
    res.send({ error: "Missing params" });
    return;
  }

  const {
    id: animeId,
    idMal,
    title,
    coverImage,
    episodes,
    duration,
  } = animeDetails;
  console.log(episodes);
  try {
    db.transaction(() => {
      //* Ottieni Ruolo utente
      const userRole: any = db
        .prepare(
          `SELECT u.role FROM 'Shared List User' u
        JOIN 'Shared List' l ON l.shared_list_id = u.shared_list_id
        WHERE l.shared_list_id = ? AND u.role = 0 | u.role = 1
        `,
        )
        .get(listId);
      console.log(userRole.role);
      if (userRole > 1) {
        res.send({
          error: "L'utente non ha i permessi per aggiungere l'anime",
        });
        return;
      }
      //* Aggiorna (upsert) la tabella Anime con i dettagli dell'anime
      const animeUpsert = db
        .prepare(
          `INSERT INTO Anime (anime_id, anime_mal_id, anime_title, anime_cover, anime_episodes, anime_avg_episode_duration) VALUES(?, ?, ?, ?, ?, ?)
        ON CONFLICT (anime_id)
        DO UPDATE SET anime_title = @title, anime_cover = @cover, anime_episodes = @episodes, anime_avg_episode_duration = @duration`,
        )
        .run(animeId, idMal, title, coverImage, episodes, duration, {
          title: title,
          cover: coverImage,
          episodes: episodes,
          duration: duration,
        });
      console.log("Anime Upsert: ", animeUpsert);

      //* Aggiungi anime in SharedListAnime
      const resp = db
        .prepare(
          "INSERT INTO 'Shared List Anime'(shared_list_id,anime_id,added_on,last_activity_at) VALUES(?,?, datetime('now'), datetime('now'))",
        )
        .run(listId, animeId);
      console.log("Shared List Anime: ", resp);
    })();
    res.send({ message: "Added" });
    return;
  } catch (error) {
    console.log(error);
  }
  res.send({ error: "Error on add" });
});

app.delete("/shared-list/:userId/:listId/entrie/:animeId", (req, res) => {
  const { userId, listId, animeId } = req.params;

  if (!userId || !listId || !animeId) {
    res.send({ error: "Missing params" });
    return;
  }

  try {
    db.transaction(() => {
      //* Ottieni Ruolo utente
      const userRole: any = db
        .prepare(
          `SELECT u.role FROM 'Shared List User' u
        JOIN 'Shared List' l ON l.shared_list_id = u.shared_list_id
        WHERE l.shared_list_id = ? AND u.role = 0
        `,
        )
        .get(listId);
      console.log(userRole.role);
      if (userRole > 0) {
        res.send({ error: "L'utente non ha i permessi per eliminare l'anime" });
        return;
      }

      //* Cancella da Shared List Anime
      const delStmt = db
        .prepare(
          `DELETE FROM 'Shared List Anime' WHERE shared_list_id = ? AND anime_id = ?`,
        )
        .run(listId, animeId);
      console.log("Delete Shared Anime", delStmt);

      //* Cancella tutti i progressi in Shared List Progress
      const resp = db
        .prepare(
          "DELETE FROM 'Shared List Progress' WHERE shared_list_id = ? AND anime_id = ?",
        )
        .run(listId, animeId);
      console.log("Delete Shared Anime Progress: ", resp);
    })();
    res.send({ message: "Deleted" });
    return;
  } catch (error) {
    console.log(error);
  }
  res.send({ error: "Error on add" });
});

app.post(
  "/shared-list/:userId/:listId/progress/entrie/:animeId",
  (req, res) => {
    const { userId, listId, animeId } = req.params;

    if (!userId || !listId || !animeId) {
      res.send({ error: "Missing params" });
      return;
    }

    try {
      db.transaction(() => {
        const watchedEpisode: any = db
          .prepare(
            "SELECT last_episode_watched FROM 'Watched Episodes' WHERE user_id = ? AND anime_id = ?",
          )
          .get(userId, animeId);
        const privateAnime: any = db
          .prepare(
            'SELECT anime_id, status FROM "Private Anime" WHERE user_id = ? AND anime_id = ?',
          )
          .get(userId, animeId);
        const userProgress: any = db
          .prepare(
            `
        SELECT *, sa.shared_list_id FROM 'Shared List Anime' sa
        LEFT JOIN 'Shared List Progress' p ON p.shared_list_id = sa.shared_list_id
          AND p.anime_id = sa.anime_id AND p.user_id = @userId
        WHERE sa.shared_list_id = @listId AND sa.anime_id = @animeId`,
          )
          .get({ listId, userId, animeId });

        //*Se progress === null, crea Shared List Progress, aggiungi a watching
        if (!userProgress?.current_episode) {
          const insertProgress = db
            .prepare(
              `
            INSERT INTO 'Shared List Progress' (shared_list_id, user_id, anime_id, current_episode, updated_at)
              VALUES (?, ?, ?, ?, datetime('now'))`,
            )
            .run(listId, userId, animeId, 1);
          const updateShareListAnime = db
            .prepare(
              "UPDATE 'Shared List Anime' SET last_activity_at = datetime('now') WHERE shared_list_id = ? AND anime_id = ?",
            )
            .run(listId, animeId);

          //* SE non è in private anime aggiungi in watching
          if (!privateAnime) {
            const insertPrivateAnime = db
              .prepare(
                "INSERT INTO 'Private Anime' (user_id, status, anime_id, added_on) VALUES (?,?,?, datetime('now'))",
              )
              .run(userId, 1, animeId);
            //*Aggiungi in watched episodes
            const insertWatchedEpisodes = db
              .prepare(
                "INSERT INTO 'Watched Episodes' (user_id, anime_id, last_episode_watched) VALUES (?,?,?)",
              )
              .run(userId, animeId, 1);
            //* SE è in private anime ma ha status dropped, sposta in watching (se è completed non fare niente)
          } else if (privateAnime.status === 3) {
            const updatePrivateAnime = db
              .prepare(
                "UPDATE 'Private Anime' SET status = 1 WHERE anime_id = ? AND user_id = ?",
              )
              .run(animeId, userId);
            if (watchedEpisode && watchedEpisode?.last_episode_watched < 1) {
              const updateWatchedEpisodes = db
                .prepare(
                  "UPDATE 'Watched Episodes' SET last_episode_watched = ? WHERE anime_id = ? AND user_id = ?",
                )
                .run(1, animeId, userId);
            }
          }
        }
        //*Se progress !== null, aggiorna puntata in Shared List Progress, ottieni valore di watching
        else {
          const animeEpisodes: any = db
            .prepare("SELECT anime_episodes FROM 'Anime' WHERE anime_id = ?")
            .get(animeId);

          if (
            userProgress.current_episode + 1 <=
            animeEpisodes.anime_episodes
          ) {
            const updateSharedListProgress = db
              .prepare(
                "UPDATE 'Shared List Progress' SET current_episode = ?, updated_at = datetime('now') WHERE shared_list_id = ? AND user_id = ? AND anime_id = ?",
              )
              .run(userProgress.current_episode + 1, listId, userId, animeId);
            const updateShareListAnime = db
              .prepare(
                "UPDATE 'Shared List Anime' SET last_activity_at = datetime('now') WHERE shared_list_id = ? AND anime_id = ?",
              )
              .run(listId, animeId);

            if (
              watchedEpisode &&
              watchedEpisode?.last_episode_watched <=
                userProgress.current_episode
            ) {
              const updateWatchedEpisodes = db
                .prepare(
                  "UPDATE 'Watched Episodes' SET last_episode_watched = ? WHERE anime_id = ? AND user_id = ?",
                )
                .run(userProgress.current_episode + 1, animeId, userId);
              if (
                animeEpisodes.anime_episodes ===
                userProgress.current_episode + 1
              ) {
                //* Move anime to completed
                const updatePrivateAnime = db
                  .prepare(
                    "UPDATE 'Private Anime' SET STATUS = ? WHERE anime_id = ? AND user_id = ?",
                  )
                  .run(2, animeId, userId);
              }
              //* Se avevo messo l'anime in dropped dopo che avevo fatto progressi in shared List devo rimetterlo in watching
              console.log("CONTROLLO ", privateAnime);
              if (privateAnime.status === 3) {
                const updatePrivateAnime = db
                  .prepare(
                    "UPDATE 'Private Anime' SET STATUS = ? WHERE anime_id = ? AND user_id = ?",
                  )
                  .run(1, animeId, userId);
              }
            }
          }
        }
      })();
      res.send({ message: "Updated Progress" });
      return;
    } catch (error) {
      console.log(error);
    }
    res.send({ error: "Error on update progress" });
  },
);

const RSA_PRIVATE_KEY = "RSAPRIVATE";
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.send({ error: "Missing params" });
    return;
  }

  try {
    const user: any = db
      .prepare("SELECT * FROM User WHERE email = ?")
      .get(email);
    if (!user) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    // const passwordMatch = bcrypt.compareSync(password, user.password);
    const passwordMatch = true;
    if (!passwordMatch) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      {
        userId: user.user_id,
      },
      RSA_PRIVATE_KEY,
      {
        // algorithm: "RS256",
        expiresIn: "15s",
        // subject: user.user_id,
      },
    );

    const refreshToken = jwt.sign(
      {
        userId: user.user_id,
      },
      RSA_PRIVATE_KEY,
      { expiresIn: "30d" },
    );

    db.prepare("UPDATE User SET refresh_token = ? WHERE user_id = ?").run(
      refreshToken,
      user.user_id,
    );

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.send({
      user: {
        userId: user.user_id,
        username: user.username,
        avatar: user.avatar,
        banner: user.banner,
      },
      accessToken: accessToken,
    });
  } catch (error) {
    console.log(error);
  }
  return res.status(401).send({ error: "Invalid credentials" });
});

app.get("/testauth", (req, res) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).send({ error: "Access denied" });
  }

  console.log(authHeader);

  const token = authHeader.split(" ")[1];
  console.log(token);
  try {
    const verified = jwt.verify(token, RSA_PRIVATE_KEY);
    console.log("VERIFIED ", verified);
    if (verified) {
      return res.send({ message: "AUTENTICATO" });
    }
  } catch (error) {
    return res.status(401).send({ error: "Invalid Token" });
  }
});

app.get("/refresh-token", (req, res) => {
  const cookies = req.cookies;

  if (!cookies.jwt) return res.sendStatus(401);

  const refreshToken = cookies.jwt;

  const foundUser: { user_id: string } | undefined = db
    .prepare("SELECT user_id FROM User WHERE refresh_token = ?")
    .get(refreshToken) as any;
  console.log(foundUser);
  if (!foundUser) return res.sendStatus(403);

  jwt.verify(
    refreshToken,
    RSA_PRIVATE_KEY,
    (err, decoded: { userId: string }) => {
      if (err || foundUser.user_id !== decoded.userId) {
        console.log("ERROR?", decoded, foundUser.user_id);
        return res.sendStatus(403);
      }

      const accessToken = jwt.sign(
        {
          userId: decoded.userId,
        },
        RSA_PRIVATE_KEY,
        { expiresIn: "5s" },
      );

      res.send({ accessToken });
    },
  );
});

app.get("/session", (req, res) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).send({ error: "Access denied" });
  }

  console.log(authHeader);

  const token = authHeader.split(" ")[1];
  console.log(token);
  // try {
  //   const verified = jwt.verify(token, RSA_PRIVATE_KEY);
  // } catch (error) {
  //   return res.status(403).send({ error: "Invalid Token" });
  // }

  const cookies = req.cookies;

  if (!cookies.jwt) return res.sendStatus(401);

  const refreshToken = cookies.jwt;

  const foundUser: any = db
    .prepare("SELECT * FROM User WHERE refresh_token = ?")
    .get(refreshToken) as any;

  if (!foundUser) return res.sendStatus(401);

  res.send({ user: foundUser });
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
