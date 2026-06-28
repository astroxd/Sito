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
    let p = Number(page);

    if (isNaN(p) || p < 1) {
      p = 1;
    }

    const offset = (p - 1) * perPage;

    let searchQuery = typeof q === "string" ? q.trim() : "";
    if (searchQuery.length > 100) {
      return res
        .status(400)
        .json({ message: "La query di ricerca è troppo lunga" });
    }

    const friends = Friendship.findFriendishipByName(
      userId,
      "ACCEPTED",
      searchQuery,
      perPage,
      offset,
    );

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
    let p = Number(page);

    if (isNaN(p) || p < 1) {
      p = 1;
    }

    const offset = (p - 1) * perPage;

    let searchQuery = typeof q === "string" ? q.trim() : "";

    if (searchQuery.length > 100) {
      return res
        .status(400)
        .json({ message: "La query di ricerca è troppo lunga" });
    }

    const foundUsers = User.searchByUsername(
      userId,
      searchQuery,
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
  const userId = res.locals.userId;
  const { receiverUserId } = req.body;

  if (!receiverUserId) {
    return res.status(400).json({ message: "ID destinatario mancante" });
  }

  if (userId === Number(receiverUserId)) {
    return res
      .status(400)
      .json({ message: "Non puoi inviare una richiesta a te stesso" });
  }

  //* in friendship table, userId1 has to be always the smallest between the two users
  const userId1 = Math.min(userId, Number(receiverUserId));
  const userId2 = Math.max(userId, Number(receiverUserId));

  try {
    const existingFriendship = Friendship.findFriendshipByUsers(
      userId1,
      userId2,
    );

    if (existingFriendship) {
      switch (existingFriendship.status) {
        case "PENDING":
          return res
            .status(400)
            .json({ message: "C'è già una richiesta in sospeso tra voi" });

        case "ACCEPTED":
          return res.status(400).json({ message: "Siete già amici" });

        default:
          return res.status(400).json({ message: "Relazione già esistente" });
      }
    }

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
    const existingFriendship = Friendship.findFriendshipByUsers(
      userId1,
      userId2,
    );

    if (!existingFriendship) {
      return res
        .status(404)
        .json({ message: "Nessuna richiesta di amicizia trovata" });
    }

    if (existingFriendship.status !== "PENDING") {
      return res.status(400).json({
        message: "Impossibile accettare",
      });
    }

    if (existingFriendship.senderUserId === userId) {
      return res.status(403).json({
        message:
          "Non puoi accettare una richiesta di amicizia inviata da te stesso!",
      });
    }

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

  if (!senderUserId) {
    return res.status(400).json({ message: "Missing Params" });
  }

  //* in friendship table, userId1 has to be always the smallest between the two users
  const userId1 = Math.min(userId, Number(senderUserId));
  const userId2 = Math.max(userId, Number(senderUserId));

  try {
    const existingFriendship = Friendship.findFriendshipByUsers(
      userId1,
      userId2,
    );

    if (!existingFriendship) {
      return res
        .status(404)
        .json({ message: "Nessuna richiesta di amicizia trovata" });
    }

    if (existingFriendship.status !== "PENDING") {
      return res.status(400).json({
        message: "Impossibile eliminare",
      });
    }

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
    const existingFriendship = Friendship.findFriendshipByUsers(
      userId1,
      userId2,
    );

    if (!existingFriendship) {
      return res.status(404).json({
        message: "Nessun legame di amicizia trovato con questo utente",
      });
    }

    if (existingFriendship.status !== "ACCEPTED") {
      return res.status(400).json({
        message: "Impossibile rimuovere l'amico",
      });
    }

    Friendship.deleteFriend(userId1, userId2, "ACCEPTED");
    return res.status(200).json({ message: "Removed friend" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};
