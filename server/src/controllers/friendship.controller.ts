import { Request, Response } from "express";

import {
  Friendship,
  FriendsResponse,
  FriendUser,
} from "../models/friend.model";

import { User } from "../models/user.model";

export const getFriendsAndRequests = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  try {
    const friends = Friendship.findAllFriendship(userId);

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

export const searchFriends = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  try {
    const { q, page } = req.query;
    const p = parseInt((page as string) ?? 1);
    const offset = (p - 1) * perPage;

    console.log(userId, q, perPage, offset);

    const friends = Friendship.findFriendishipByName(
      userId,
      "ACCEPTED",
      String(q),
      perPage,
      offset,
    );
    console.log(friends);
    return res.status(200).json({ data: friends });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const searchUsers = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  try {
    const { q, page } = req.query;
    const p = parseInt((page as string) ?? 1);
    const offset = (p - 1) * perPage;

    console.log(q, page);

    const foundUsers = User.searchByUsername(
      userId,
      String(q),
      perPage,
      offset,
    );

    let hasNextPage = false;
    if (foundUsers.length > 0) {
      hasNextPage = foundUsers[0].count > p * perPage;
    }

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
    Friendship.addFriend(userId1, userId2, "PENDING", userId);

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
    Friendship.updateFriend(userId1, userId2, "ACCEPTED");

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
    Friendship.deleteFriend(userId1, userId2, "PENDING");

    return res.status(200).json({ message: "Declined Request" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const removeFriend = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { friendId } = req.params;

  if (!friendId) {
    return res.status(400).json({ message: "MISSING PARAMS" });
  }

  //* in friendship table, userId1 has to be always the smallest between the two users
  const userId1 = Math.min(userId, Number(friendId));
  const userId2 = Math.max(userId, Number(friendId));

  try {
    Friendship.deleteFriend(userId1, userId2, "ACCEPTED");
    return res.status(200).json({ message: "Removed friend" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};
