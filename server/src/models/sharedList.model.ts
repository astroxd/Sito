import db from "../config/database";

interface SharedListUser {
  sharedListId: number;
  userId: number;
  role: number;
}

export interface SharedList {
  id: number;
  name: string;
  message?: string;

  sharedListUser?: SharedListUser;
  sharedListMembers: SharedListMember[];
}

export interface SharedListMember {
  id: number;
  username: string;
  avatar: string;
  role: number;
  totalEpisodes: number;
  length: number;
}

export interface SharedListProgress {
  sharedListId: number;
  userId: number;
  animeId: number;
  currentEpisode: number;
  updatedAt?: string;
}

export interface SharedListAnime {
  sharedListId: number;
  animeId: number;
  addedOn?: string;
  lastActivityAt?: string;
}

export interface Anime {
  animeId: number;
  animeMalId: number;
  animeTitle: string;
  animeCover: string;
  animeEpisodes: number;
  animeAvgEpisodeDuration?: number;
}

export type SharedListUserProgress = SharedListProgress & Anime;

export interface AnimeProgress {
  username: string;
  avatar: string;
  currentEpisode: number;
  animeId: number;
  updatedAt: string;
}

export const SharedList = {
  findAllByUserId: (userId: number) => {
    return db
      .prepare(
        `
            SELECT l.shared_list_id as id, l.shared_list_name as name, l.message, u.user_id as userId, u.role
            FROM 'Shared List' l
            JOIN 'Shared List User' u ON l.shared_list_id = u.shared_list_id
            WHERE u.user_id = ?
        `,
      )
      .all(userId) as SharedList[];
  },

  findAllMembersByListId: (listId: number) => {
    return db
      .prepare(
        `
            SELECT User.user_id as id, User.avatar, User.username, u.role, IFNULL(SUM(p.current_episode), 0) as totalEpisodes, COUNT(*) OVER() AS length 
            FROM 'Shared List User' u
            LEFT JOIN 'Shared List Progress' p ON p.user_id = u.user_id AND p.shared_list_id = u.shared_list_id 
            INNER JOIN 'User' ON User.user_id = u.user_id
            WHERE u.shared_list_id = ?
            GROUP BY u.user_id
            ORDER BY totalEpisodes DESC
            LIMIT 5
        `,
      )
      .all(listId) as SharedListMember[];
  },

  createWithUserId: (
    userId: number,
    sharedListName: string,
    message?: string,
  ) => {
    const sharedListId = db
      .prepare(
        "INSERT INTO 'Shared List' (shared_list_name, message) VALUES (?, ?)",
      )
      .run(sharedListName, message).lastInsertRowid;

    db.prepare(
      "INSERT INTO 'Shared List User' (shared_list_id, user_id, role) VALUES (?, ?, ?)",
    ).run(sharedListId, userId, 0);
  },

  findByListId: (listId: number, userId: number) => {
    return db
      .prepare(
        `
          SELECT l.shared_list_id as id, l.shared_list_name as name, l.message, u.user_id as userId, u.role
          FROM 'Shared List' l
          JOIN 'Shared List User' u ON l.shared_list_id = u.shared_list_id AND u.user_id = ?
          WHERE l.shared_list_id = ?
      `,
      )
      .get(userId, listId) as SharedList | undefined;
  },

  findUserProgressByUserId: (listId: number, userId: number) => {
    return db
      .prepare(
        `
          SELECT sa.shared_list_id as sharedListId, p.user_id as userId, p.current_episode as currentEpisode, p.updated_at as updatedAt, a.anime_id as animeId, a.anime_mal_id as animeMalId, a.anime_title as animeTitle, a.anime_cover as animeCover, a.anime_episodes as animeEpisodes
          FROM 'Shared List Anime' sa
          LEFT JOIN 'Shared List Progress' p ON p.shared_list_id = sa.shared_list_id
            AND p.anime_id = sa.anime_id AND p.user_id = @userId
          JOIN 'Anime' a ON a.anime_id = sa.anime_id
          WHERE sa.shared_list_id = @listId
          ORDER BY p.updated_at DESC
      `,
      )
      .all({ listId, userId }) as SharedListUserProgress[];
  },

  findAllAnimeByListId: (listId: number) => {
    return db
      .prepare(
        `
          SELECT sa.shared_list_id as sharedListId, sa.last_activity_at as lastActivityAt, a.anime_id as animeId, a.anime_mal_id as animeMalId, a.anime_title as animeTitle, a.anime_cover as animeCover, a.anime_episodes as animeEpisodes
          FROM 'Shared List Anime' sa
          JOIN 'Anime' a ON a.anime_id = sa.anime_id
          WHERE sa.shared_list_id = ?
      `,
      )
      .all(listId) as (SharedListAnime & Anime)[];
  },

  findAnimeProgress: (listId: number, animeId: number) => {
    return db
      .prepare(
        ` 
          SELECT User.username, User.avatar, p.current_episode as currentEpisode, p.anime_id as animeId, p.updated_at as updatedAt 
          FROM 'Shared List Progress' p
          INNER JOIN 'Shared List User' u  ON u.shared_list_id = p.shared_list_id AND p.shared_list_id = @listId AND u.user_id = p.user_id 
          INNER JOIN 'User' ON User.user_id = u.user_id
          WHERE p.anime_id = @animeId
          ORDER BY p.current_episode DESC
          `,
      )
      .all({ listId, animeId }) as AnimeProgress[];
  },
};
