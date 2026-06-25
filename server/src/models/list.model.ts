import { stat } from "node:fs";
import db from "../config/database";

export interface PrivateAnime {
  userId: number;
  animeId: number;
  status: AnimeStatus;
  addedOn?: string;
  updatedAt?: string;
}

export interface ListedAnime extends PrivateAnime {
  animeMalId: number;
  animeTitle: string;
  animeCover: string;
  animeEpisodes: number;
  lastEpisodeWatched: number;
  length?: number;
}

export enum AnimeStatus {
  Watching = "WATCHING",
  Completed = "COMPLETED",
  Dropped = "DROPPED",
}

export const List = {
  findAllByStatus: (
    userId: number,
    status: AnimeStatus,
    perPage: number,
    offset = 0,
  ) => {
    return db
      .prepare(
        `
          SELECT p.user_id as userId, p.status, a.anime_id as animeId, a.anime_mal_id as animeMalId, a.anime_title as animeTitle, a.anime_cover as animeCover, a.anime_episodes as animeEpisodes, w.last_episode_watched as lastEpisodeWatched, COUNT(*) OVER() AS length 
          FROM 'Private Anime' p
          JOIN Anime a ON a.anime_id = p.anime_id
          JOIN 'Watched Episodes' w ON w.anime_id = p.anime_id AND w.user_id = p.user_id
          WHERE p.user_id = ? AND p.status = ?
          LIMIT ?
          OFFSET ?
        `,
      )
      .all(userId, status, perPage, offset) as ListedAnime[];
  },

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

  findByAnimeTitle: (
    userId: number,
    status: AnimeStatus,
    perPage: number,
    offset = 0,
    animeTitle: string,
  ) => {
    return db
      .prepare(
        `
          SELECT p.user_id as userId, p.status, a.anime_id as animeId, a.anime_mal_id as animeMalId, a.anime_title as animeTitle, a.anime_cover as animeCover, a.anime_episodes as animeEpisodes, w.last_episode_watched as lastEpisodeWatched, COUNT(*) OVER() AS length 
          FROM 'Private Anime' p
          JOIN Anime a ON a.anime_id = p.anime_id
          JOIN 'Watched Episodes' w ON w.anime_id = p.anime_id
          WHERE p.user_id = ? AND p.status = ? AND a.anime_title COLLATE UTF8_GENERAL_CI LIKE @query
          LIMIT ?
          OFFSET ?
        `,
      )
      .all(userId, status, perPage, offset, {
        query: animeTitle + "%",
      }) as ListedAnime[];
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
            UPDATE 'Private Anime' SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE anime_id = ? AND user_id = ?
        `,
      )
      .run(status, animeId, userId).lastInsertRowid;
  },

  deleteByAnimeId: (userId: number, animeId: number) => {
    return db
      .prepare(
        `
            DELETE FROM 'Private Anime'
            WHERE user_id = ? AND anime_id = ?
        `,
      )
      .run(userId, animeId).changes;
  },

  findAnimesProgressByUserId: (userId: number, status: AnimeStatus) => {
    return db
      .prepare(
        `
          SELECT p.user_id as userId, p.status, a.anime_id as animeId, a.anime_mal_id as animeMalId, a.anime_title as animeTitle, a.anime_cover as animeCover, a.anime_episodes as animeEpisodes, w.last_episode_watched as lastEpisodeWatched
          FROM 'Private Anime' p
          JOIN Anime a ON a.anime_id = p.anime_id
          JOIN 'Watched Episodes' w ON w.anime_id = p.anime_id AND w.user_id = p.user_id
          WHERE p.user_id = ? AND p.status = ?
          ORDER BY p.updated_at DESC
        `,
      )
      .all(userId, status) as ListedAnime[];
  },
};
