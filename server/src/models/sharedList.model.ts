import db from "../config/database";
import { Anime } from "./anime.model";

export type SharedListRole = "OWNER" | "EDITOR" | "MEMBER";
export type SharedListInvitationStatus = "PENDING" | "ACCEPTED";

interface SharedListUser {
  sharedListId: number;
  userId: number;
  role: SharedListRole;
}

export interface InvitedUser {
  userId: number;
  username: string;
  avatar: string;
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
  role: SharedListRole;
  totalEpisodes: number;
  length: number;
}

export interface SharedListProgress {
  sharedListId: number;
  userId: number;
  animeId: number;
  currentEpisode?: number;
  updatedAt?: string;
}

export interface SharedListAnime {
  sharedListId: number;
  animeId: number;
  addedOn?: string;
  lastActivityAt?: string;
}

export type SharedListUserProgress = SharedListProgress & Anime;

export interface AnimeProgress {
  username: string;
  avatar: string;
  currentEpisode: number;
  animeId: number;
  updatedAt: string;
}

export interface SharedListInvitation {
  sharedListId: number;
  sharedListName: string;
  senderUserId: number;
  senderUsername: string;
  senderAvatar: string;
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
    role: SharedListRole = "OWNER",
  ) => {
    const sharedListId = db
      .prepare(
        "INSERT INTO 'Shared List' (shared_list_name, message) VALUES (?, ?)",
      )
      .run(sharedListName, message).lastInsertRowid;

    db.prepare(
      "INSERT INTO 'Shared List User' (shared_list_id, user_id, role) VALUES (?, ?, ?)",
    ).run(sharedListId, userId, role);
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
          ORDER BY sa.last_activity_at DESC
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

  findUserAnimeProgressByAnimeId: (
    listId: number,
    userId: number,
    animeId: number,
  ) => {
    return db
      .prepare(
        `
            SELECT sa.shared_list_id as sharedListId, sa.anime_id as animeId, p.user_id as userId, p.current_episode as currentEpisode, p.updated_at as updatedAt
            FROM 'Shared List Anime' sa
            LEFT JOIN 'Shared List Progress' p ON p.shared_list_id = sa.shared_list_id
              AND p.anime_id = sa.anime_id AND p.user_id = @userId
            WHERE sa.shared_list_id = @listId AND sa.anime_id = @animeId 
        `,
      )
      .get({ listId, userId, animeId }) as SharedListProgress | undefined;
  },

  insertUserProgress: (
    listId: number,
    userId: number,
    animeId: number,
    currentEpisode: number,
  ) => {
    return db
      .prepare(
        `
          INSERT INTO 'Shared List Progress' (shared_list_id, user_id, anime_id, current_episode)
          VALUES (?, ?, ?, ?)
        `,
      )
      .run(listId, userId, animeId, currentEpisode).lastInsertRowid;
  },

  updateUserProgress: (
    listId: number,
    userId: number,
    animeId: number,
    currentEpisode: number,
  ) => {
    return db
      .prepare(
        `
          UPDATE 'Shared List Progress'
          SET current_episode = ?, updated_at = CURRENT_TIMESTAMP
          WHERE shared_list_id = ? AND user_id = ? AND anime_id = ?
        `,
      )
      .run(currentEpisode, listId, userId, animeId);
  },

  updateAnimeLastActivity: (listId: number, animeId: number) => {
    return db
      .prepare(
        `
          UPDATE 'Shared List Anime' SET last_activity_at = CURRENT_TIMESTAMP
          WHERE shared_list_id = ? AND anime_id = ?
        `,
      )
      .run(listId, animeId).lastInsertRowid;
  },

  getUserRole: (listId: number, userId: number) => {
    return db
      .prepare(
        ` 
          SELECT u.role FROM 'Shared List User' u
          WHERE u.shared_list_id = ? AND u.user_id = ?
        `,
      )
      .get(listId, userId) as { role: SharedListRole } | undefined;
  },

  addSharedAnime: (listId: number, animeId: number) => {
    return db
      .prepare(
        `
        INSERT INTO 'Shared List Anime'(shared_list_id,anime_id)
        VALUES(?,?)
      `,
      )
      .run(listId, animeId).lastInsertRowid;
  },

  deleteSharedAnime: (listId: number, animeId: number) => {
    return db
      .prepare(
        `
        DELETE FROM 'Shared List Anime'
        WHERE shared_list_id = ? AND anime_id = ?
      `,
      )
      .run(listId, animeId);
  },

  findAllWithAnimeId: (animeId: number, userId: number) => {
    return db
      .prepare<
        unknown[],
        { sharedListId: number; sharedListName: string; animeId?: number }
      >(
        `
        SELECT l.shared_list_id as sharedListId, l.shared_list_name as sharedListName,a.anime_id as animeId FROM 'Shared List' l
        LEFT JOIN 'Shared List Anime' a ON a.shared_list_id = l.shared_list_id AND a.anime_id = ?
        LEFT JOIN 'Shared List User' u ON u.shared_list_id = l.shared_list_id
        WHERE u.user_id = ?`,
      )
      .all(animeId, userId);
  },

  insertUser: (
    listId: number,
    userId: number,
    role: SharedListRole = "MEMBER",
  ) => {
    db.prepare(
      `
        INSERT INTO 'Shared List User' (shared_list_id, user_id, role) 
        VALUES (?, ?, ?)
      `,
    ).run(listId, userId, role);
  },

  insertUserInvitation: (
    listId: number,
    senderUserId: number,
    invitedUserId: number,
  ) => {
    db.prepare(
      `
        INSERT INTO 'SharedListInvitation' (shared_list_id, sender_user_id, invited_user_id)
        VALUES (?, ?, ?)
      `,
    ).run(Number(listId), senderUserId, invitedUserId);
  },

  updateUserInvitation: (
    listId: number,
    status: SharedListInvitationStatus,
    invitedUserId: number,
  ) => {
    db.prepare(
      `
        UPDATE 'SharedListInvitation'
        SET status = ?
        WHERE shared_list_id = ? AND invited_user_id = ?
      `,
    ).run(status, Number(listId), invitedUserId);
  },

  deleteUserInvitation: (
    listId: number,
    invitedUserId: number,
    status: SharedListInvitationStatus,
  ) => {
    db.prepare(
      `
        DELETE FROM 'SharedListInvitation'
        WHERE shared_list_id = ? AND invited_user_id = ? AND status = ?
      `,
    ).run(Number(listId), invitedUserId, status);
  },

  findMembersCount: (listId: number) => {
    return db
      .prepare(
        `
          SELECT COUNT(*) as count FROM 'Shared List User' 
          WHERE shared_list_id = ?
        `,
      )
      .get(listId) as number | 0;
  },

  updateNewOwner: (listId: number, userId: number) => {
    db.prepare(
      `
        UPDATE 'Shared List User'
        SET role = 'OWNER'
        WHERE shared_list_id = ?
          AND user_id = (
            SELECT user_id FROM 'Shared List User'
            WHERE shared_list_id = ? AND user_id != ?
            ORDER BY joined_at ASC
            LIMIT 1
          )
      `,
    ).run(listId, listId, userId);
  },

  deleteList: (listId: number) => {
    db.prepare(
      `
        DELETE FROM 'Shared List' 
        WHERE shared_list_id = ?
      `,
    ).run(listId);
  },

  deleteUser: (listId: number, userId: number) => {
    db.prepare(
      `
        DELETE FROM 'Shared List User'
         WHERE shared_list_id = ? AND user_id = ?
      `,
    ).run(listId, userId);
  },

  findAllInvitedUsers: (listId: number, status: SharedListInvitationStatus) => {
    return db
      .prepare(
        `
          SELECT 
            u.user_id as userId, 
            u.username as username, 
            u.avatar as avatar
          FROM 'SharedListInvitation' i
          JOIN 'User' u ON i.invited_user_id = u.user_id
          WHERE i.shared_list_id = ? AND i.status = ?
          ORDER BY i.created_at DESC
      `,
      )
      .all(listId, status) as InvitedUser[];
  },

  findAllUserInvitations: (
    userId: number,
    status: SharedListInvitationStatus,
  ) => {
    return db
      .prepare(
        `
          SELECT 
            i.shared_list_id as sharedListId,
            l.shared_list_name as sharedListName,
            u.user_id as senderUserId,
            u.username as senderUsername,
            u.avatar as senderAvatar
          FROM 'SharedListInvitation' i
          JOIN 'Shared List' l ON i.shared_list_id = l.shared_list_id
          JOIN 'User' u ON i.sender_user_id = u.user_id
          WHERE i.invited_user_id = ?
            AND i.status = ?
          ORDER BY i.created_at DESC
      `,
      )
      .all(userId, status) as SharedListInvitation[];
  },

  updateUserRole: (listId: number, userId: number, role: SharedListRole) => {
    db.prepare(
      `
        UPDATE 'Shared List User'
        SET role = ?
        WHERE shared_list_id = ? AND user_id = ? AND role != 'OWNER'
    `,
    ).run(role, listId, userId);
  },

  updateMessage: (listId: number, message: string) => {
    db.prepare(
      `
        UPDATE 'Shared List'
        SET message = ?
        WHERE shared_list_id = ?
    `,
    ).run(message, listId);
  },
};
