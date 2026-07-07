import { Request, Response } from "express";
import {
  AnimeProgress,
  SharedList,
  SharedListAnime,
} from "../models/sharedList.model";

import db from "../config/database";
import { User } from "../models/user.model";
import { List, AnimeStatus } from "../models/list.model";
import { Anime } from "../models/anime.model";
import { trackWatchTime, updateGenreStats } from "./statistics.controller";
import { checkAndUnlockBadges } from "./badge.controller";

export const getSharedLists = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Retrieve all shared lists associated with the authenticated user, including member details.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = { 
        schema: { $ref: '#/definitions/SharedListsResponse' } 
     }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;

  try {
    const sharedLists = SharedList.findAllByUserId(Number(userId));

    const sharedListsInfo = sharedLists.map((list) => {
      const members = SharedList.findAllMembersByListId(list.id);

      return {
        sharedList: list,
        members: members,
        sharedListMembersNumber: members.length,
      };
    });

    return res.status(200).json({ data: sharedListsInfo });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "Internal server errror",
  });
};

export const createSharedList = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Create a new shared list for the authenticated user.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'CreateSharedListBody',
        description: 'Details for the new shared list',
        required: true,
        schema: { $ref: '#/definitions/CreateSharedListBody' }
     }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const cleanedName = name.trim();
    if (cleanedName.length > 100) {
      return res.status(400).json({
        message: "The list name cannot exceed 100 characters",
      });
    }
    SharedList.createWithUserId(userId, name);

    return res.status(200).json({ message: "Shared List created" });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "Internal server error",
  });
};

export const getSharedList = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Retrieve full details of a specific shared list by ID, including its members.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.responses[200] = { 
        schema: { $ref: '#/definitions/SingleSharedListResponse' } 
     }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { listId } = req.params;

  try {
    const sharedListInfo = SharedList.findByListId(Number(listId), userId);

    if (!sharedListInfo) {
      return res
        .status(404)
        .json({ message: `Missing shared list with ID ${listId}` });
    }

    const sharedListMembers = SharedList.findAllMembersByListId(Number(listId));

    return res.status(200).json({
      data: {
        sharedList: sharedListInfo,
        members: sharedListMembers,
        sharedListMembersNumber: sharedListMembers.length,
      },
    });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const getSharedUserProgress = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Retrieve the anime progress of the authenticated user within a specific shared list.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.responses[200] = { 
        schema: { $ref: '#/definitions/UserProgressResponse' } 
     }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { listId } = req.params;

  try {
    const userProgress = SharedList.findUserProgressByUserId(
      Number(listId),
      userId,
    );

    return res.status(200).json({ data: userProgress });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const getSharedAnimesProgress = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Retrieve the combined progress of all users for every anime in a specific shared list.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.responses[200] = { 
        schema: { $ref: '#/definitions/SharedAnimesProgressResponse' } 
     }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const { listId } = req.params;

  try {
    const sharedListAnimes = SharedList.findAllAnimeByListId(Number(listId));

    let sharedListProgress: {
      anime: SharedListAnime & Anime;
      progress: AnimeProgress[];
    }[] = [];

    sharedListAnimes.forEach((anime) => {
      const animeProgress = SharedList.findAnimeProgress(
        Number(listId),
        anime.animeId,
      );

      sharedListProgress.push({
        anime: anime,
        progress: animeProgress,
      });
    });

    return res.status(200).json({ data: sharedListProgress });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server errror",
  });
};

export const updateSharedUserProgress = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Increment the authenticated user\'s watched episode count for a specific anime inside a shared list and sync stats.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.parameters['animeId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the anime to update' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const { listId, animeId } = req.params;
  const userId = res.locals.userId;

  if (!animeId) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    db.transaction(() => {
      const watchedEpisode = User.findLastEpisodeWatchedByAnimeId(
        userId,
        Number(animeId),
      );

      const privateAnime = List.findPrivateAnimeByAnimeId(
        userId,
        Number(animeId),
      );

      const userProgress = SharedList.findUserAnimeProgressByAnimeId(
        Number(listId),
        userId,
        Number(animeId),
      );

      const anime = Anime.findAnimeById(Number(animeId));

      if (!anime) {
        return res.status(404).json({ message: "Missing anime in catalog" });
      }

      const maxEpisodes = anime.animeEpisodes;
      const genresArray = anime.animeGenres
        ? anime.animeGenres.split(",").map((g: string) => g.trim())
        : [];

      let newCurrentEpisode = 1;

      if (userProgress?.currentEpisode) {
        newCurrentEpisode = userProgress.currentEpisode + 1;
      }

      if (newCurrentEpisode > maxEpisodes!) {
        return res.status(200).json({ message: "Already caught up" });
      }

      if (!userProgress?.currentEpisode) {
        //* Prima volta che vede l'anime nella lista condivisa
        SharedList.insertUserProgress(
          Number(listId),
          userId,
          Number(animeId),
          newCurrentEpisode,
        );
      } else {
        //* Non è la prima volta che lo vede, update progress
        SharedList.updateUserProgress(
          Number(listId),
          userId,
          Number(animeId),
          newCurrentEpisode,
        );
      }
      SharedList.updateAnimeLastActivity(Number(listId), Number(animeId));

      //* SE non è nella lista privata, aggiungo come ultimo episodio visto quello appena segnato
      //* e aggiorno le statistiche
      //* ALTRIMENTI update l'ultimo episodio visto e aggiorno la statistica di una sola puntata
      if (!watchedEpisode) {
        User.insertAnimeIntoWatchedEpisodes(
          userId,
          Number(animeId),
          newCurrentEpisode,
        );
        trackWatchTime(
          userId,
          newCurrentEpisode,
          anime?.animeAvgEpisodeDuration!,
        );
      } else {
        const lastWatchedPrivate = watchedEpisode?.lastEpisodeWatched || 0;
        if (lastWatchedPrivate < newCurrentEpisode) {
          //* Se la lista condivisa è più avanti di quella privata, aumento il counter privato
          User.updateLastWatchedEpisode(
            userId,
            Number(animeId),
            newCurrentEpisode,
          );
        }
        //* Aggiornamento statistiche
        trackWatchTime(userId, 1, anime?.animeAvgEpisodeDuration ?? 0);
      }

      //* Calcolo del nuovo stato dell'anime
      if (privateAnime?.status !== AnimeStatus.Completed) {
        const calculatedStatus =
          newCurrentEpisode === maxEpisodes
            ? AnimeStatus.Completed
            : AnimeStatus.Watching;

        //* Se non l'ho mai visto da solo, oppure l'ho tolto forzatamente lo inserisco in watching o completed
        if (!privateAnime) {
          List.insertPrivateAnime(userId, Number(animeId), calculatedStatus);
          if (calculatedStatus === AnimeStatus.Completed) {
            updateGenreStats(userId, genresArray, "INCREMENT");
          }
        } else {
          //* Se esisteva (ed era DROPPED o WATCHING), lo aggiorno solo se il nuovo stato è diverso
          if (privateAnime.status !== calculatedStatus) {
            List.updateAnimeStatus(userId, Number(animeId), calculatedStatus);
            if (calculatedStatus === AnimeStatus.Completed) {
              updateGenreStats(userId, genresArray, "INCREMENT");
            }
          }
        }
      }

      checkAndUnlockBadges(userId);
    })();
    return res.status(200).json({ message: "Progress updated successfully" });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "Internal server error",
  });
};

export const addSharedAnime = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Add an anime to the shared list. Requires OWNER or EDITOR role.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'AddSharedAnimeBody',
        description: 'Details of the anime to add',
        required: true,
        schema: { $ref: '#/definitions/AddSharedAnimeBody' }
     }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[403] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userRole = res.locals.userRole;
  const { listId } = req.params;
  const { animeDetails } = req.body;

  console.log(animeDetails);
  try {
    db.transaction(() => {
      if (!["OWNER", "EDITOR"].includes(userRole)) {
        return res.status(403).json({
          message:
            "The user does not have permission to add anime to this list",
        });
      }
      //* Aggiorna (upsert) la tabella Anime con i dettagli dell'anime
      Anime.animeUpsert(Anime.sanitizeAnime(animeDetails));

      SharedList.addSharedAnime(Number(listId), animeDetails.id);
    })();
    return res.status(200).json({ message: "Added" });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "Internal server errror",
  });
};

export const removeSharedAnime = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Remove an anime from the shared list. Requires OWNER or EDITOR role.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.parameters['animeId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the anime to remove' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[403] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userRole = res.locals.userRole;

  const { listId, animeId } = req.params;

  if (!animeId) {
    return res.status(400).json({ message: "MISSING PARAMS" });
  }

  try {
    if (!["OWNER", "EDITOR"].includes(userRole)) {
      return res.status(403).json({
        message:
          "The user does not have permission to remove anime from this list",
      });
    }

    SharedList.deleteSharedAnime(Number(listId), Number(animeId));

    return res.status(200).json({ message: "Anime removed successfully" });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "Internal server error",
  });
};

export const getAllSharedListsWithAnimeId = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Retrieve all shared lists associated with the user, indicating if the specific anime is present or not.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['animeId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the anime to check' }
     #swagger.responses[200] = { 
        schema: { $ref: '#/definitions/SharedListsWithAnimeResponse' } 
     }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { animeId } = req.params;

  if (!animeId) {
    return res.status(400).json({ error: "Missing parameters" });
  }
  try {
    const sharedLists = SharedList.findAllWithAnimeId(Number(animeId), userId);

    return res.status(200).json({ data: sharedLists });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const addMemberRequest = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Invite a new user to the shared list. Requires OWNER role.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'InviteMemberBody',
        description: 'ID of the user to invite',
        required: true,
        schema: { $ref: '#/definitions/InviteMemberBody' }
     }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[403] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const userRole = res.locals.userRole;
  const { listId } = req.params;
  const { memberId } = req.body;

  try {
    if (userRole !== "OWNER") {
      return res.status(403).json({
        message: "The user does not have permission to invite members",
      });
    }

    const existingRole = SharedList.getUserRole(Number(listId), memberId);

    if (existingRole) {
      return res.status(400).json({
        message: "The user is already a member of this list",
      });
    }

    const isAlreadyInvited = SharedList.checkIfInvitationPending(
      Number(listId),
      memberId,
    );
    if (isAlreadyInvited) {
      return res
        .status(400)
        .json({ message: "An invitation has already been sent to this user" });
    }

    SharedList.insertUserInvitation(Number(listId), userId, memberId);

    return res.status(200).json({ message: "Member invited successfully" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const acceptSharedListRequest = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Accept a pending invitation to join a shared list.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list invitation to accept' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { listId } = req.params;

  if (!listId) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const listExists = SharedList.exists(Number(listId));
    if (!listExists) {
      return res.status(404).json({
        message: "This shared list no longer exists or has been deleted",
      });
    }

    const existingRole = SharedList.getUserRole(Number(listId), userId);
    if (existingRole) {
      return res
        .status(400)
        .json({ message: "You are already a member of this list" });
    }
    db.transaction(() => {
      SharedList.updateUserInvitation(Number(listId), "ACCEPTED", userId);
      SharedList.insertUser(Number(listId), userId, "MEMBER");
    })();

    return res.status(200).json({ message: "Member joined successfully" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const declineSharedListRequest = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Decline a pending invitation to a shared list.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list invitation to decline' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { listId } = req.params;

  if (!listId) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const listExists = SharedList.exists(Number(listId));
    if (!listExists) {
      return res.status(404).json({
        message: "This shared list no longer exists or has been deleted",
      });
    }

    SharedList.deleteUserInvitation(Number(listId), userId, "PENDING");

    return res
      .status(200)
      .json({ message: "Invitation declined successfully" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const cancelSharedListRequest = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Cancel a pending invitation sent to a user. Requires OWNER role.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.parameters['userId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the invited user' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[403] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const { listId, userId } = req.params;
  const userRole = res.locals.userRole;

  try {
    if (userRole !== "OWNER") {
      return res.status(403).json({
        message: "You do not have permission to cancel this invitation",
      });
    }

    SharedList.deleteUserInvitation(Number(listId), Number(userId), "PENDING");

    return res
      .status(200)
      .json({ message: "Invitation cancelled successfully" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const removeMember = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Remove a member from the shared list or leave the list. Requires OWNER role unless removing oneself.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.parameters['userId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the member to remove' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[403] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const currentUserId = res.locals.userId;
  const currentUserRole = res.locals.userRole;
  const { listId, userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const isSelfRemoval = currentUserId === Number(userId);

    if (!isSelfRemoval && currentUserRole !== "OWNER") {
      return res.status(403).json({
        message: "You do not have permission to remove members from this list",
      });
    }

    const memberRole = SharedList.getUserRole(
      Number(listId),
      Number(userId),
    )?.role;

    if (!memberRole) {
      return res.status(404).json({ message: "Member not found in this list" });
    }

    db.transaction(() => {
      if (memberRole === "OWNER") {
        const totalMembers = SharedList.findMembersCount(Number(listId));

        if (totalMembers.count > 1) {
          SharedList.updateNewOwner(Number(listId), Number(userId));
        } else {
          SharedList.deleteList(Number(listId));
          return;
        }
      }

      SharedList.deleteUser(Number(listId), Number(userId));
      SharedList.deleteUserInvitation(
        Number(listId),
        Number(userId),
        "ACCEPTED",
      );

      //* Forse i progressi potrei lasciarli
      // db.prepare(
      //   `DELETE FROM 'Shared List Progress' WHERE shared_list_id = ? AND user_id = ?`,
      // ).run(Number(listId), Number(userId));

      SharedList.deleteUserInvitation(
        Number(listId),
        Number(userId),
        "ACCEPTED",
      );
    })();

    const successMessage = isSelfRemoval
      ? "You have left the list successfully"
      : "Member removed successfully";

    return res.status(200).json({ message: successMessage });
  } catch (error) {
    console.error(error);

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPendingMembers = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Retrieve a list of users who have pending invitations for this shared list.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.responses[200] = { 
        schema: { $ref: '#/definitions/PendingMembersResponse' } 
     }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const { listId } = req.params;

  try {
    const sharedListPendingMembers = SharedList.findAllInvitedUsers(
      Number(listId),
      "PENDING",
    );

    return res.status(200).json({
      data: sharedListPendingMembers,
    });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const getInvites = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Retrieve all pending shared list invitations received by the authenticated user, including list info, sender data, and current members.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = { 
        schema: { $ref: '#/definitions/InvitesListResponse' } 
     }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;

  try {
    const sharedListsInvitations = SharedList.findAllUserInvitations(
      userId,
      "PENDING",
    );

    const sharedListsInfo = sharedListsInvitations.map((invitation) => {
      const members = SharedList.findAllMembersByListId(
        invitation.sharedList.sharedListId,
      );

      return {
        sharedList: invitation.sharedList,
        members,
        sharedListMembersNumber: members.length,
        senderInfo: invitation.senderInfo,
      };
    });

    return res.status(200).json({ data: sharedListsInfo });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "Internal server error",
  });
};

export const updateMemberRole = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Update a member\'s role within the shared list. Requires OWNER role.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.parameters['userId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the target member' }
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'UpdateRoleBody',
        description: 'The new role for the member',
        required: true,
        schema: { $ref: '#/definitions/UpdateRoleBody' }
     }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[403] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const currentUserId = res.locals.userId;
  const currentUserRole = res.locals.userRole;
  const { listId, userId } = req.params;
  const { newRole } = req.body;

  if (!["EDITOR", "MEMBER"].includes(newRole)) {
    return res
      .status(400)
      .json({ message: "Invalid role. Must be 'EDITOR' or 'MEMBER'" });
  }

  if (!userId) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    if (currentUserId === Number(userId)) {
      return res.status(400).json({
        message: "You cannot change your own role as an OWNER.",
      });
    }

    if (currentUserRole !== "OWNER") {
      return res
        .status(403)
        .json({ message: "Only the OWNER can change member roles" });
    }

    const targetUserRole = SharedList.getUserRole(
      Number(listId),
      Number(userId),
    )?.role;
    if (!targetUserRole) {
      return res
        .status(404)
        .json({ message: "The specified user is not a member of this list" });
    }

    SharedList.updateUserRole(Number(listId), Number(userId), newRole);

    return res
      .status(200)
      .json({ message: `Role updated to ${newRole} successfully` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSharedListMessage = (req: Request, res: Response) => {
  /* #swagger.tags = ['Shared Lists']
     #swagger.description = 'Update the custom broadcast message of the shared list. Allowed only for the active Leader or the OWNER if no leader exists.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['listId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the shared list' }
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'UpdateMessageBody',
        description: 'New message or null to clear it',
        required: true,
        schema: { $ref: '#/definitions/UpdateMessageBody' }
     }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[403] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const userRole = res.locals.userRole;
  const { listId } = req.params;
  let { message } = req.body;

  if (typeof message === "string") {
    message = message.trim();

    if (message.length > 255) {
      return res
        .status(400)
        .json({ message: "The message cannot exceed 255 characters" });
    }

    if (message === "") {
      message = null;
    }
  } else {
    message = null;
  }

  try {
    const leader = SharedList.getLeader(Number(listId));

    if (!leader) {
      if (userRole !== "OWNER") {
        return res.status(403).json({
          message:
            "There is no Leader in this list yet. Only the OWNER can modify the message.",
        });
      }
    } else {
      if (userId !== leader.userId) {
        return res.status(403).json({
          message: `Only the current Leader of this list (${leader.username}) can modify this message!`,
        });
      }
    }

    SharedList.updateMessage(Number(listId), message);

    return res.status(200).json({ message: "Message updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
