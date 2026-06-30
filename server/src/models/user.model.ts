import db from "../config/database";

export interface User {
  id: number;
  email: string;
  username: string;
  password?: string;
  avatar?: string;
  banner?: string;
  created_on?: string;
  refresh_token?: string;
}

export interface FoundUser {
  userId: number;
  username: string;
  avatar: string;
  count: number;
}

const serverUrl = "http://localhost:3001";

export const User = {
  findByEmail: (email: string) => {
    const foundUser = db
      .prepare(
        "SELECT user_id AS id, email, username, avatar, banner FROM User WHERE email = ?",
      )
      .get(email) as User | undefined;

    if (foundUser !== undefined) {
      return {
        ...foundUser,
        avatar: User.formatUserAvatar(foundUser.username, foundUser.avatar),
      };
    }
  },

  findByUsername: (username: string) => {
    const foundUser = db
      .prepare(
        "SELECT user_id AS id, email, username, avatar, banner FROM User WHERE username = ?",
      )
      .get(username) as User | undefined;

    if (foundUser !== undefined) {
      return {
        ...foundUser,
        avatar: User.formatUserAvatar(foundUser.username, foundUser.avatar),
      };
    }
    return foundUser;
  },

  findByRefreshToken: (refreshToken: string) => {
    const foundUser = db
      .prepare(
        "SELECT user_id AS id, email, username, avatar, banner FROM User WHERE refresh_token = ?",
      )
      .get(refreshToken) as User | undefined;

    if (foundUser !== undefined) {
      return {
        ...foundUser,
        avatar: User.formatUserAvatar(foundUser.username, foundUser.avatar),
      };
    }
    return foundUser;
  },

  searchByUsername: (userId: number, username: string, perPage, offset = 0) => {
    const foundUsers = db
      .prepare(
        `
            SELECT u.user_id as userId, u.username, u.avatar, COUNT(*) OVER() as count
            FROM 'User' u
            WHERE u.user_id != ? AND u.username COLLATE UTF8_GENERAL_CI LIKE @query
            LIMIT ?
            OFFSET ?
        `,
      )
      .all(userId, perPage, offset, { query: username + "%" }) as FoundUser[];

    return foundUsers.map((user) => {
      return {
        ...user,
        avatar: User.formatUserAvatar(user.username, user.avatar),
      };
    });
  },

  createUser: (
    email: string,
    password: string,
    username: string,
    avatar?: string,
  ) => {
    const result = db
      .prepare(
        `INSERT INTO User(email, password, username, avatar, banner)
                        VALUES(?,?,?,?,?)`,
      )
      .run(email, password, username, avatar ?? null, "");

    return result.lastInsertRowid;
  },

  updateRefreshToken: (userId: number | bigint, refreshToken: string) => {
    const result = db
      .prepare("UPDATE User SET refresh_token = ? WHERE user_id = ?")
      .run(refreshToken, userId);

    return result.lastInsertRowid;
  },

  getPasswordFromEmail: (email: string) => {
    const result = db
      .prepare("SELECT password FROM User WHERE email = ?")
      .get(email) as { password: string } | undefined;
    return result?.password;
  },

  revokeRefreshToken: (userId: number) => {
    const result = db
      .prepare("UPDATE User SET refresh_token = NULL WHERE user_id = ?")
      .run(userId);

    return result.lastInsertRowid;
  },

  findLastEpisodeWatchedByAnimeId: (userId: number, animeId: number) => {
    return db
      .prepare(
        `
        SELECT last_episode_watched as lastEpisodeWatched
        FROM 'Watched Episodes' 
        WHERE user_id = ? AND anime_id = ?
      `,
      )
      .get(userId, animeId) as { lastEpisodeWatched: number } | undefined;
  },
  insertAnimeIntoWatchedEpisodes: (
    userId: number,
    animeId: number,
    watchedEpisodes = 1,
  ) => {
    return db
      .prepare(
        `
          INSERT INTO 'Watched Episodes' (user_id, anime_id, last_episode_watched)
          VALUES (?,?,?)
        `,
      )
      .run(userId, animeId, watchedEpisodes);
  },

  updateLastWatchedEpisode: (
    userId: number,
    animeId: number,
    lastWatchedEpisode: number,
  ) => {
    return db
      .prepare(
        `
          UPDATE 'Watched Episodes' SET last_episode_watched = ? 
          WHERE anime_id = ? AND user_id = ?
        `,
      )
      .run(lastWatchedEpisode, animeId, userId).lastInsertRowid;
  },

  deleteFromWatchingByAnimeId: (userId: number, animeId: number) => {
    return db
      .prepare(
        `
          DELETE FROM 'Watched Episodes' 
          WHERE user_id = ? AND anime_id = ?
        `,
      )
      .run(userId, animeId).changes;
  },

  formatUserAvatar: (username: string, avatar: string | null | undefined) => {
    return avatar
      ? `${serverUrl}/static/avatar/${avatar}`
      : `https://api.dicebear.com/9.x/initials/svg?seed=${username}`;
  },
};
