import db from "../config/database";

export interface User {
  id: number;
  email: string;
  username: string;
  password?: string;
  avatar: string;
  banner?: string;
  created_on?: string;
  refresh_token?: string;
}

export const User = {
  findByEmail: (email: string) => {
    return db
      .prepare(
        "SELECT user_id AS id, email, username, avatar, banner FROM User WHERE email = ?",
      )
      .get(email) as User | undefined;
  },

  findByUsername: (username: string) => {
    return db
      .prepare(
        "SELECT user_id AS id, email, username, avatar, banner FROM User WHERE username = ?",
      )
      .get(username) as User | undefined;
  },

  findByRefreshToken: (refreshToken: string) => {
    return db
      .prepare(
        "SELECT user_id AS id, email, username, avatar, banner FROM User WHERE refresh_token = ?",
      )
      .get(refreshToken) as User | undefined;
  },

  createUser: (
    email: string,
    password: string,
    username: string,
    avatar?: string,
  ) => {
    if (!avatar) {
      avatar = `https://api.dicebear.com/9.x/initials/svg?seed=${username}`;
    }

    const result = db
      .prepare(
        `INSERT INTO User(email, password, username, avatar, banner)
                        VALUES(?,?,?,?,?)`,
      )
      .run(email, password, username, avatar, "");

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
};
