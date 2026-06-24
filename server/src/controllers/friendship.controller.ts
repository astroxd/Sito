import { Request, Response } from "express";
import db from "../config/database";

export interface FriendUser {
  friendUserId: number;
  friendUsername: string;
  friendAvatar: string;
}

export type FriendshipRequestStatus = "PENDING" | "ACCEPTED";

export interface FriendshipRecord extends FriendUser {
  senderUserId: number;
  status: FriendshipRequestStatus;
}

export interface FriendsResponse {
  accepted: FriendUser[];
  pending: (FriendUser & { isIncoming: boolean })[];
}

export interface FoundUser {
  userId: number;
  username: string;
  avatar: string;
  count: number;
}

export const getFriendsAndRequests = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  try {
    const friends = db
      .prepare(
        `
            SELECT f.sender_user_id as senderUserId, f.status, u.user_id as friendUserId, u.username as friendUsername, u.avatar as friendAvatar 
            FROM 'Friendship' f
            JOIN 'User' u ON (u.user_id = f.user_id_1 OR u.user_id = f.user_id_2) AND u.user_id != @currentUserId
            WHERE f.user_id_1 = @currentUserId OR f.user_id_2 = @currentUserId
        `,
      )
      .all({ currentUserId: userId }) as FriendshipRecord[];

    const friendsData = friends.reduce<FriendsResponse>(
      (acc, record) => {
        const friend: FriendUser = {
          ...record,
        };

        if (record.status === "ACCEPTED") {
          acc.accepted.push(friend);
        } else if (record.status === "PENDING") {
          acc.pending.push({
            ...friend,
            isIncoming: record.senderUserId !== userId,
          });
        }
        return acc;
      },
      { accepted: [], pending: [] },
    );

    return res.status(200).json({ data: friendsData });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

const perPage = 12;
export const searchUsers = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  try {
    const { q, page } = req.query;
    const p = parseInt((page as string) ?? 1);
    const offset = (p - 1) * perPage;

    console.log(q, page);

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
      .all(userId, perPage, offset, { query: q + "%" }) as FoundUser[];

    let hasNextPage = false;
    if (foundUsers.length > 0) {
      hasNextPage = foundUsers[0].count > p * perPage;
    }

    console.log(foundUsers);

    return res.status(200).json({
      data: foundUsers,
      page: p,
      perPage,
      hasNextPage,
    });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const addFriendRequest = (req: Request, res: Response) => {
  console.log("ADD FRIEND");
  const userId = res.locals.userId;
  const { receiverUserId } = req.body;

  //* in friendship table, userId1 has to be always the smallest between the two users
  const userId1 = Math.min(userId, receiverUserId);
  const userId2 = Math.max(userId, receiverUserId);

  try {
    db.prepare(
      `
        INSERT INTO 'Friendship' (user_id_1, user_id_2, status, sender_user_id)
        VALUES (?, ?, 'PENDING', ?)
      `,
    ).run(userId1, userId2, userId);

    return res.status(200).json({ message: "Sent Request" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const acceptFriendRequest = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { senderUserId } = req.body;

  if (!senderUserId) {
    return res.status(400).json({ message: "Missing Params" });
  }

  //* in friendship table, userId1 has to be always the smallest between the two users
  const userId1 = Math.min(userId, Number(senderUserId));
  const userId2 = Math.max(userId, Number(senderUserId));

  try {
    db.prepare(
      `
        UPDATE 'Friendship'
        SET status = 'ACCEPTED'
        WHERE user_id_1 = ? AND user_id_2 = ? AND status = 'PENDING' AND sender_user_id = ?
      `,
    ).run(userId1, userId2, senderUserId);

    return res.status(200).json({ message: "Accepted Request" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const deleteFriendRequest = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { senderUserId } = req.params;

  //* in friendship table, userId1 has to be always the smallest between the two users
  const userId1 = Math.min(userId, Number(senderUserId));
  const userId2 = Math.max(userId, Number(senderUserId));

  try {
    db.prepare(
      `
        DELETE FROM 'Friendship'
        WHERE user_id_1 = ? AND user_id_2 = ? AND status = 'PENDING'
      `,
    ).run(userId1, userId2);

    return res.status(200).json({ message: "Declined Request" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};
