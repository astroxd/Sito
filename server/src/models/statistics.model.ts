import db from "../config/database";

export type AnimeGenre =
  | "Action"
  | "Adventure"
  | "Comedy"
  | "Drama"
  | "Ecchi"
  | "Fantasy"
  | "Horror"
  | "Mahou Shoujo"
  | "Mecha"
  | "Music"
  | "Mystery"
  | "Psychological"
  | "Romance"
  | "Sci-Fi"
  | "Slice of Life"
  | "Sports"
  | "Supernatural"
  | "Thriller"
  | "Hentai";

export const VALID_GENRES_SET = new Set<string>([
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
  "Hentai",
]);

export interface UserTotalTime {
  userId: number;
  totalTime: number;
}

export interface UserGenre {
  userId: number;
  genre: AnimeGenre;
  watchedAnimes: number;
}

export interface UserDailyWatchtime {
  userId: number;
  date: string;
  watchtime: number;
}

export const Statistics = {
  getUserTotalTime: (userId: number) => {
    return db
      .prepare(
        `
        SELECT user_id as userId, total_time as totalTime
        FROM 'Statistics' 
        WHERE user_id = ?
      `,
      )
      .get(userId) as UserTotalTime | undefined;
  },

  getUserGenres: (userId: number) => {
    return db
      .prepare(
        `
        SELECT user_id as userId, genre, watched_animes as watchedAnimes
        FROM 'Genre'
        WHERE user_id = ? AND watched_animes > 0
      `,
      )
      .all(userId) as UserGenre[];
  },

  getDailyWatchtimeInRange: (userId: number, start: string, end: string) => {
    return db
      .prepare(
        `
        SELECT user_id as userId, date, watchtime
        FROM 'Daily WatchTime'
        WHERE user_id = ? AND date BETWEEN ? AND ?
        ORDER BY date DESC
      `,
      )
      .all(userId, start, end) as UserDailyWatchtime[];
  },

  updateUserTotalTime: (userId: number, deltaMinutes: number) => {
    db.prepare(
      `
        INSERT INTO 'Statistics' (user_id, total_time) 
        VALUES (?, MAX(0,?))
        ON CONFLICT(user_id) DO UPDATE SET total_time = MAX(0, total_time + ?)    
      `,
    ).run(userId, deltaMinutes, deltaMinutes);
  },

  updateDailyWatchtime: (userId: number, deltaMinutes: number) => {
    db.prepare(
      `
        INSERT INTO 'Daily WatchTime' (user_id, date, watchtime) 
        VALUES (?, DATE('now'), MAX(0, ?))
        ON CONFLICT(user_id, date) DO UPDATE SET watchtime = MAX(0, watchtime + ?)
      `,
    ).run(userId, deltaMinutes, deltaMinutes);
  },

  updateUserGenres: (
    userId: number,
    genre: AnimeGenre,
    deltaAnimeCount: number,
  ) => {
    db.prepare(
      `
       INSERT INTO 'Genre' (user_id, genre, watched_animes) 
        VALUES (?, ?, MAX(0, ?))
        ON CONFLICT(user_id, genre) DO UPDATE SET watched_animes = MAX(0, watched_animes + ?)
      `,
    ).run(userId, genre, deltaAnimeCount, deltaAnimeCount);
  },
};
