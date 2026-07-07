import db from "../config/database";
import { User } from "./user.model";

export type FriendshipRequestStatus = "PENDING" | "ACCEPTED";

export interface Friendship {
  userId1: number;
  userId2: number;
  status: FriendshipRequestStatus;
  senderUserId: number;
}

export interface FriendUser {
  friendUserId: number;
  friendUsername: string;
  friendAvatar: string;
  count?: number;
}

export interface FriendshipInfo extends FriendUser {
  senderUserId: number;
  status: FriendshipRequestStatus;
}

export interface FriendsResponse {
  accepted: FriendUser[];
  pending: (FriendUser & { isIncoming: boolean })[];
}

export const Friendship = {
  findAllFriendship: (userId: number) => {
    const foundFriendship = db
      .prepare(
        `
            SELECT f.sender_user_id as senderUserId, f.status, u.user_id as friendUserId, u.username as friendUsername, u.avatar as friendAvatar 
            FROM 'Friendship' f
            JOIN 'User' u ON (u.user_id = f.user_id_1 OR u.user_id = f.user_id_2) AND u.user_id != @currentUserId
            WHERE f.user_id_1 = @currentUserId OR f.user_id_2 = @currentUserId
        `,
      )
      .all({ currentUserId: userId }) as FriendshipInfo[];

    return foundFriendship.map((user) => {
      return {
        ...user,
        friendAvatar: User.formatUserAvatar(
          user.friendUsername,
          user.friendAvatar,
        ),
      };
    });
  },

  findFriendishipByName: (
    userId: number,
    status: FriendshipRequestStatus,
    name: string,
    perPage: number,
    offset = 0,
  ) => {
    const foundFriendship = db
      .prepare(
        `
            SELECT u.user_id as friendUserId, u.username as friendUsername, u.avatar as friendAvatar, COUNT(*) OVER() as count
            FROM 'Friendship' f
            JOIN 'User' u ON (u.user_id = f.user_id_1 OR u.user_id = f.user_id_2) AND u.user_id != @currentUserId
            WHERE (f.user_id_1 = @currentUserId OR f.user_id_2 = @currentUserId) AND f.status = @status
            AND u.username COLLATE UTF8_GENERAL_CI LIKE @query
            LIMIT @limit
            OFFSET @offset
    `,
      )
      .all({
        currentUserId: userId,
        query: name + "%",
        status,
        limit: perPage,
        offset,
      }) as FriendUser[];

    return foundFriendship.map((user) => {
      return {
        ...user,
        friendAvatar: User.formatUserAvatar(
          user.friendUsername,
          user.friendAvatar,
        ),
      };
    });
  },

  findFriendshipByUsers: (userId1: number, userId2: number) => {
    return db
      .prepare(
        `
        SELECT user_id_1 as userId1, user_id_2 as userId2, status, sender_user_id as senderUserId
        FROM 'Friendship'
        WHERE user_id_1 = ? AND user_id_2 = ?
      `,
      )
      .get(userId1, userId2) as Friendship;
  },

  addFriend: (
    userId1: number,
    userId2: number,
    status: FriendshipRequestStatus,
    senderUserId: number,
  ) => {
    return db
      .prepare(
        `
        INSERT INTO 'Friendship' (user_id_1, user_id_2, status, sender_user_id)
        VALUES (?, ?, ?, ?)
      `,
      )
      .run(userId1, userId2, status, senderUserId);
  },

  updateFriend: (
    userId1: number,
    userId2: number,
    status: FriendshipRequestStatus,
  ) => {
    db.prepare(
      `
        UPDATE 'Friendship'
        SET status = ?
        WHERE user_id_1 = ? AND user_id_2 = ? AND status = 'PENDING'
      `,
    ).run(status, userId1, userId2);
  },

  deleteFriend: (
    userId1: number,
    userId2: number,
    status: FriendshipRequestStatus,
  ) => {
    db.prepare(
      `
        DELETE FROM 'Friendship'
        WHERE user_id_1 = ? AND user_id_2 = ? AND status = ?
      `,
    ).run(userId1, userId2, status);
  },
};
