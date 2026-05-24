import db from "../config/database";

export interface PrivateAnime {
  userId: number;
  animeId: number;
  status: AnimeStatus;
  addedOn?: string;
}

export type AnimeStatus = "WATCHING" | "COMPLETED" | "DROPPED";

export const List = {
  findPrivateAnimeByAnimeId: (userId: number, animeId: number) => {
    return db
      .prepare(
        ` 
            SELECT user_id as userId, anime_id as animeId, status, added_on as addedOn 
            FROM 'Private Anime' 
            WHERE user_id = ? AND anime_id = ?
        `,
      )
      .get(userId, animeId) as PrivateAnime | undefined;
  },

  insertPrivateAnime: (
    userId: number,
    animeId: number,
    status: AnimeStatus,
  ) => {
    return db
      .prepare(
        `
            INSERT INTO 'Private Anime' (user_id, anime_id, status)
            VALUES (?,?,?)
        `,
      )
      .run(userId, animeId, status).lastInsertRowid;
  },

  updateAnimeStatus: (userId: number, animeId: number, status: AnimeStatus) => {
    return db
      .prepare(
        `
            UPDATE 'Private Anime' SET status = ?
            WHERE anime_id = ? AND user_id = ?
        `,
      )
      .run(status, animeId, userId).lastInsertRowid;
  },
};
