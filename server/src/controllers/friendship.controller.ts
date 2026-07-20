import { Request, Response } from "express";

import {
  Friendship,
  FriendsResponse,
  FriendUser,
} from "../models/friend.model";

import { User } from "../models/user.model";

export const getFriendsAndRequests = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Friends']
     #swagger.description = 'Retrieve the current user\'s entire network context, categorizing established friendships and separating incoming versus outgoing pending requests.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = { schema: { data: { $ref: '#/definitions/FriendsResponse' } } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;

  try {
    const friends = await Friendship.findAllFriendship(userId);

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
    message: "Internal server error",
  });
};

const perPage = 12;

export const searchFriends = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Friends']
     #swagger.description = 'Search exclusively within the current user\'s accepted friends list by matching their username against a search query.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['q'] = { in: 'query', type: 'string', required: false, description: 'Search query for friend username' }
     #swagger.parameters['page'] = { in: 'query', type: 'integer', required: false, description: 'Page number for pagination' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/SearchFriendsResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
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
      return res.status(400).json({ message: "Search query is too long" });
    }

    const friends = await Friendship.findFriendshipByName(
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
    message: "Internal server error",
  });
};

export const searchUsers = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Friends']
     #swagger.description = 'Perform a global search to look up any system user by their username, filtering out the current user.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['q'] = { in: 'query', type: 'string', required: false, description: 'Global search string' }
     #swagger.parameters['page'] = { in: 'query', type: 'integer', required: false, description: 'Page number' }
     #swagger.responses[200] = { 
        schema: { $ref: '#/definitions/GlobalSearchUsersResponse' }
     }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
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
      return res.status(400).json({ message: "Search query is too long" });
    }

    const [foundUsers, countSearchMatches] = await Promise.all([
      User.searchByUsername(userId, searchQuery, perPage, offset),
      User.countSearchMatches(userId, searchQuery),
    ]);

    let hasNextPage = false;
    if (countSearchMatches > 0) {
      hasNextPage = countSearchMatches > p * perPage;
    }

    return res.status(200).json({
      data: { items: foundUsers, countNumber: countSearchMatches },
      page: p,
      perPage,
      hasNextPage,
    });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const addFriendRequest = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Friends']
     #swagger.description = 'Dispatch a outbound pending friend request to a target system user.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'FriendRequestBody',
        description: 'Target receiver unique identifier',
        required: true,
        schema: { receiverUserId: 42 }
     }
     #swagger.responses[200] = { schema: { message: "Friend request sent successfully" } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { receiverUserId } = req.body;

  if (!receiverUserId) {
    return res.status(400).json({ message: "Missing receiver user ID" });
  }

  if (userId === Number(receiverUserId)) {
    return res
      .status(400)
      .json({ message: "You cannot send a friend request to yourself" });
  }

  //* in friendship table, userId1 has to be always the smallest between the two users
  const userId1 = Math.min(userId, Number(receiverUserId));
  const userId2 = Math.max(userId, Number(receiverUserId));

  try {
    const existingFriendship = await Friendship.findFriendshipByUsers(
      userId1,
      userId2,
    );

    if (existingFriendship) {
      switch (existingFriendship.status) {
        case "PENDING":
          return res.status(400).json({
            message: "A pending request already exists between you two",
          });
        case "ACCEPTED":
          return res.status(400).json({ message: "You are already friends" });
        default:
          return res
            .status(400)
            .json({ message: "Relationship already established" });
      }
    }

    await Friendship.addFriend(userId1, userId2, "PENDING", userId);

    return res
      .status(200)
      .json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Friends']
     #swagger.description = 'Accept an incoming pending friend request. Validates that the request exists, is currently PENDING, and was not originally sent by the accepting user.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'AcceptFriendBody',
        description: 'Object containing the user ID of the request sender',
        required: true,
        schema: { senderUserId: 42 }
     }
     #swagger.responses[200] = { schema: { message: "Friend request accepted successfully" } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[403] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { senderUserId } = req.body;

  if (!senderUserId) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  //* in friendship table, userId1 has to be always the smallest between the two users
  const userId1 = Math.min(userId, Number(senderUserId));
  const userId2 = Math.max(userId, Number(senderUserId));

  try {
    const existingFriendship = await Friendship.findFriendshipByUsers(
      userId1,
      userId2,
    );

    if (!existingFriendship) {
      return res.status(404).json({ message: "No friend request found" });
    }

    if (existingFriendship.status !== "PENDING") {
      return res.status(400).json({
        message: "Action not allowed",
      });
    }

    if (existingFriendship.senderUserId === userId) {
      return res.status(403).json({
        message: "You cannot accept a friend request sent by yourself",
      });
    }

    await Friendship.updateFriend(userId1, userId2, "ACCEPTED");

    return res
      .status(200)
      .json({ message: "Friend request accepted successfully" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const deleteFriendRequest = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Friends']
     #swagger.description = 'Decline or cancel an existing incoming or outgoing pending friend request.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['senderUserId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the user related to the pending request' }
     #swagger.responses[200] = { schema: { message: "Friend request declined successfully" } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { senderUserId } = req.params;

  if (!senderUserId) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  //* in friendship table, userId1 has to be always the smallest between the two users
  const userId1 = Math.min(userId, Number(senderUserId));
  const userId2 = Math.max(userId, Number(senderUserId));

  try {
    const existingFriendship = await Friendship.findFriendshipByUsers(
      userId1,
      userId2,
    );

    if (!existingFriendship) {
      return res.status(404).json({ message: "No friend request found" });
    }

    if (existingFriendship.status !== "PENDING") {
      return res.status(400).json({
        message: "Action not allowed",
      });
    }

    await Friendship.deleteFriend(userId1, userId2, "PENDING");

    return res
      .status(200)
      .json({ message: "Friend request declined successfully" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const removeFriend = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Friends']
     #swagger.description = 'Break an established friendship bond, completely removing the specified user from the current friends list.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['friendId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the friend to be removed' }
     #swagger.responses[200] = { schema: { message: "Friend removed successfully" } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { friendId } = req.params;

  if (!friendId) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  //* in friendship table, userId1 has to be always the smallest between the two users
  const userId1 = Math.min(userId, Number(friendId));
  const userId2 = Math.max(userId, Number(friendId));

  try {
    const existingFriendship = await Friendship.findFriendshipByUsers(
      userId1,
      userId2,
    );

    if (!existingFriendship) {
      return res.status(404).json({
        message: "No friendship link found with this user",
      });
    }

    if (existingFriendship.status !== "ACCEPTED") {
      return res.status(400).json({
        message: "Action not allowed",
      });
    }

    await Friendship.deleteFriend(userId1, userId2, "ACCEPTED");
    return res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};
