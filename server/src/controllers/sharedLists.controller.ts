import { Request, Response } from "express";
import {
  AnimeProgress,
  SharedList,
  SharedListAnime,
  SharedListInvitation,
  SharedListMember,
} from "../models/sharedList.model";

import db from "../config/database";
import { User } from "../models/user.model";
import { List, AnimeStatus } from "../models/list.model";
import { Anime } from "../models/anime.model";
import { trackWatchTime, updateGenreStats } from "./statistics.controller";
import { checkAndUnlockBadges } from "./badge.controller";

export const getSharedLists = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  try {
    let sharedListsInfo: {
      sharedList: SharedList;
      members: SharedListMember[];
    }[] = [];

    const sharedLists = SharedList.findAllByUserId(Number(userId));

    sharedLists.forEach((list) => {
      sharedListsInfo.push({
        sharedList: list,
        members: SharedList.findAllMembersByListId(list.id),
      });
    });

    return res.status(200).json({ data: sharedListsInfo });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const createSharedList = (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = res.locals.userId;

  if (!name) {
    return res.status(400).json({ message: "Missing Params" });
  }

  try {
    SharedList.createWithUserId(userId, name);

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const getSharedList = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { listId } = req.params;
  if (!listId) {
    return res.status(400).json({ message: "Missing params" });
  }

  try {
    const sharedListInfo = SharedList.findByListId(Number(listId), userId);

    if (!sharedListInfo) {
      return res
        .status(404)
        .json({ message: `Missing shared list with ${listId} id` });
    }

    const sharedListMembers = SharedList.findAllMembersByListId(Number(listId));

    return res.status(200).json({
      data: {
        ...sharedListInfo,
        members: sharedListMembers,
      },
    });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const getSharedUserProgress = (req: Request, res: Response) => {
  const { listId } = req.params;
  const userId = res.locals.userId;

  if (!listId) {
    return res.status(400).json({ message: "Missing params" });
  }

  try {
    const userProgress = SharedList.findUserProgressByUserId(
      Number(listId),
      userId,
    );

    console.log(userProgress);

    return res.status(200).json({ data: userProgress });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const getSharedAnimesProgress = (req: Request, res: Response) => {
  const { listId } = req.params;

  if (!listId) {
    return res.status(400).json({ message: "Missing params" });
  }

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
    message: "INTERNAL SERVER ERROR",
  });
};

export const updateSharedUserProgress = (req: Request, res: Response) => {
  const { listId, animeId } = req.params;
  const userId = res.locals.userId;

  if (!listId || !animeId) {
    return res.status(400).json({ message: "Missing params" });
  }

  if (SharedList.findByListId(Number(listId), userId) === undefined) {
    return res.status(403).json({ message: "User not authorized" });
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

      const maxEpisodes = anime?.animeEpisodes;
      const genresArray = Array.isArray(anime?.animeGenres)
        ? anime.animeGenres.map((g: string) => g.trim())
        : [];

      let newCurrentEpisode = 1;

      if (userProgress?.currentEpisode) {
        newCurrentEpisode = userProgress.currentEpisode + 1;
      }

      if (newCurrentEpisode > maxEpisodes!) {
        return res.status(200).json({ message: "Already in par" });
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
          //* */ Se la lista condivisa è più avanti di quella privata, aumento il counter privato
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
    return res.status(200).json({ message: "Updated Progress" });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const addSharedAnime = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { listId } = req.params;
  const { animeDetails } = req.body;

  if (!listId) {
    return res.status(400).json({ message: "Missing params" });
  }

  const {
    id: animeId,
    idMal,
    title,
    coverImage,
    episodes,
    duration,
    genres,
  } = animeDetails;

  try {
    db.transaction(() => {
      //* Ottieni Ruolo utente
      const userRole = SharedList.getUserRole(Number(listId), userId)?.role;
      console.log(userRole);
      if (!userRole || !["OWNER", "EDITOR"].includes(userRole)) {
        return res.status(403).json({
          message: "L'utente non ha i permessi per aggiungere l'anime",
        });
      }
      //* Aggiorna (upsert) la tabella Anime con i dettagli dell'anime
      Anime.animeUpsert({
        animeId: animeId,
        animeMalId: idMal,
        animeTitle: title,
        animeCover: coverImage,
        animeEpisodes: episodes,
        animeAvgEpisodeDuration: duration,
        animeGenres: Array.isArray(genres) ? genres.join(",") : "",
      });

      SharedList.addSharedAnime(Number(listId), animeId);
    })();
    return res.status(200).json({ message: "Added" });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const removeSharedAnime = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  const { listId, animeId } = req.params;

  if (!listId || !animeId) {
    return res.status(400).json({ message: "MISSING PARAMS" });
  }

  try {
    //* Ottieni Ruolo utente
    const userRole = SharedList.getUserRole(Number(listId), userId)?.role;

    if (!userRole || !["OWNER", "EDITOR"].includes(userRole)) {
      return res.status(403).json({
        message: "L'utente non ha i permessi per rimuover l'anime",
      });
    }

    SharedList.deleteSharedAnime(Number(listId), Number(animeId));

    return res.status(200).json({ message: "Anime Removed" });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const getAllSharedListsWithAnimeId = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { animeId } = req.params;

  if (!animeId) {
    return res.status(400).json({ error: "Missing params" });
  }
  try {
    const sharedLists = SharedList.findAllWithAnimeId(Number(animeId), userId);

    return res.status(200).json({ data: sharedLists });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const addMemberRequest = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { listId } = req.params;
  const { memberId } = req.body;

  if (!listId) {
    return res.status(400).json({ error: "Missing params" });
  }

  try {
    SharedList.insertUserInvitation(Number(listId), userId, memberId);

    return res.status(200).json({ message: "Member invited" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const acceptSharedListRequest = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { listId } = req.params;

  if (!listId) {
    return res.status(400).json({ message: "Missing Params" });
  }

  try {
    SharedList.updateUserInvitation(Number(listId), "ACCEPTED", userId);

    SharedList.insertUser(Number(listId), userId, "MEMBER");

    return res.status(200).json({ message: "Member joined" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const declineSharedListRequest = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { listId } = req.params;

  try {
    SharedList.deleteUserInvitation(Number(listId), userId, "PENDING");

    return res.status(200).json({ message: "Declined Request" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const cancelSharedListRequest = (req: Request, res: Response) => {
  const { listId, userId } = req.params;

  try {
    SharedList.deleteUserInvitation(Number(listId), Number(userId), "PENDING");

    return res.status(200).json({ message: "Cancelled Request" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const removeMember = (req: Request, res: Response) => {
  const { listId, userId } = req.params;

  if (!listId || !userId) {
    return res.status(400).json({ message: "Missing params" });
  }

  try {
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

        if (totalMembers > 1) {
          SharedList.updateNewOwner(Number(listId), Number(userId));
        } else {
          SharedList.deleteList(Number(listId));
          return; // Usciamo dalla transazione perché la lista non esiste più
        }
      }

      SharedList.deleteUser(Number(listId), Number(userId));

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

    return res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error(error);

    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const getPendingMembers = (req: Request, res: Response) => {
  const { listId } = req.params;
  if (!listId) {
    return res.status(400).json({ message: "Missing params" });
  }

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
    message: "INTERNAL SERVER ERROR",
  });
};

export const getInvites = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  try {
    let sharedListsInfo: {
      sharedList: SharedListInvitation;
      members: SharedListMember[];
    }[] = [];

    const sharedLists = SharedList.findAllUserInvitations(userId, "PENDING");

    sharedLists.forEach((list) => {
      sharedListsInfo.push({
        sharedList: list,
        members: SharedList.findAllMembersByListId(list.sharedListId),
      });
    });

    return res.status(200).json({ data: sharedListsInfo });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const updateMemberRole = (req: Request, res: Response) => {
  const currentUserId = res.locals.userId;
  const { listId, userId } = req.params;
  const { newRole } = req.body;

  if (!["EDITOR", "MEMBER"].includes(newRole)) {
    return res
      .status(400)
      .json({ message: "Invalid role. Must be 'EDITOR' or 'MEMBER'" });
  }

  if (!listId || !userId) {
    return res.status(400).json({ message: "Missing params" });
  }

  try {
    const requesterRole = SharedList.getUserRole(
      Number(listId),
      Number(currentUserId),
    )?.role;

    console.log(requesterRole);
    if (requesterRole !== "OWNER") {
      return res
        .status(403)
        .json({ message: "Only the OWNER can change member roles" });
    }

    SharedList.updateUserRole(Number(listId), Number(userId), newRole);

    return res
      .status(200)
      .json({ message: `Role updated to ${newRole} successfully` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const updateSharedListMessage = (req: Request, res: Response) => {
  const { listId } = req.params;
  let { message } = req.body;

  if (!listId) {
    return res.status(400).json({ message: "Missing params" });
  }

  try {
    if (message === undefined || message === null) {
      message = null;
    } else {
      message = message.trim();
    }

    SharedList.updateMessage(Number(listId), message);

    return res.status(200).json({ message: "Message updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};
