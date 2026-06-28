import { Request, Response } from "express";
import {
  AnimeProgress,
  SharedList,
  SharedListAnime,
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
    message: "INTERNAL SERVER ERROR",
  });
};

export const createSharedList = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ message: "Missing Params" });
  }

  try {
    const cleanedName = name.trim();
    if (cleanedName.length > 100) {
      return res.status(400).json({
        message: "Il nome della lista non può superare i 100 caratteri",
      });
    }
    SharedList.createWithUserId(userId, name);

    return res.status(200).json({ message: "Shared List created" });
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
        sharedList: sharedListInfo,
        members: sharedListMembers,
        sharedListMembersNumber: sharedListMembers.length,
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
    message: "INTERNAL SERVER ERROR",
  });
};

export const getSharedAnimesProgress = (req: Request, res: Response) => {
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
    message: "INTERNAL SERVER ERROR",
  });
};

export const updateSharedUserProgress = (req: Request, res: Response) => {
  const { listId, animeId } = req.params;
  const userId = res.locals.userId;

  if (!animeId) {
    return res.status(400).json({ message: "Missing params" });
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
    return res.status(200).json({ message: "Updated Progress" });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const addSharedAnime = (req: Request, res: Response) => {
  const userRole = res.locals.userRole;
  const { listId } = req.params;
  const { animeDetails } = req.body;

  console.log(animeDetails);
  try {
    db.transaction(() => {
      if (!["OWNER", "EDITOR"].includes(userRole)) {
        return res.status(403).json({
          message: "L'utente non ha i permessi per aggiungere l'anime",
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
    message: "INTERNAL SERVER ERROR",
  });
};

export const removeSharedAnime = (req: Request, res: Response) => {
  const userRole = res.locals.userRole;

  const { listId, animeId } = req.params;

  if (!animeId) {
    return res.status(400).json({ message: "MISSING PARAMS" });
  }

  try {
    if (!["OWNER", "EDITOR"].includes(userRole)) {
      return res.status(403).json({
        message: "L'utente non ha i permessi per rimuovere l'anime",
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
  const userRole = res.locals.userRole;
  const { listId } = req.params;
  const { memberId } = req.body;

  try {
    if (userRole !== "OWNER") {
      return res
        .status(403)
        .json({ message: "L'utente non ha i permessi per invitare membri" });
    }

    const existingRole = SharedList.getUserRole(Number(listId), memberId);

    if (existingRole) {
      return res.status(400).json({
        message: "L'utente fa già parte di questa lista",
      });
    }

    const isAlreadyInvited = SharedList.checkIfInvitationPending(
      Number(listId),
      memberId,
    );
    if (isAlreadyInvited) {
      return res
        .status(400)
        .json({ message: "È già stato inviato un invito a questo utente" });
    }

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

  try {
    const existingRole = SharedList.getUserRole(Number(listId), userId);
    if (existingRole) {
      return res
        .status(400)
        .json({ message: "Sei già un membro di questa lista" });
    }
    db.transaction(() => {
      SharedList.updateUserInvitation(Number(listId), "ACCEPTED", userId);
      SharedList.insertUser(Number(listId), userId, "MEMBER");
    })();

    console.log("FOURI TRANS");

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
  const userRole = res.locals.userRole;

  try {
    if (userRole !== "OWNER") {
      return res
        .status(403)
        .json({ message: "Non hai i permessi per cancellare l'invito" });
    }

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
  const currentUserId = res.locals.userId;
  const currentUserRole = res.locals.userRole;
  const { listId, userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "Missing params" });
  }

  try {
    const isSelfRemoval = currentUserId === Number(userId);

    if (!isSelfRemoval && currentUserRole !== "OWNER") {
      return res.status(403).json({
        message: "Non hai i permessi per espellere membri da questa lista",
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

        if (totalMembers > 1) {
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
      ? "Hai abbandonato la lista con successo"
      : "Membro espulso con successo";

    return res.status(200).json({ message: successMessage });
  } catch (error) {
    console.error(error);

    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const getPendingMembers = (req: Request, res: Response) => {
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
    message: "INTERNAL SERVER ERROR",
  });
};

export const getInvites = (req: Request, res: Response) => {
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
    message: "INTERNAL SERVER ERROR",
  });
};

export const updateMemberRole = (req: Request, res: Response) => {
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
    return res.status(400).json({ message: "Missing params" });
  }

  try {
    if (currentUserId === Number(userId)) {
      return res.status(400).json({
        message: "Non puoi modificare il tuo stesso ruolo di OWNER.",
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
        .json({ message: "L'utente specificato non fa parte di questa lista" });
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

//TODO check if is in list & is Leader
export const updateSharedListMessage = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const userRole = res.locals.userRole;
  const { listId } = req.params;
  let { message } = req.body;

  if (typeof message === "string") {
    message = message.trim();

    if (message.length > 255) {
      return res
        .status(400)
        .json({ message: "Il messaggio non può superare i 255 caratteri" });
    }

    if (message === "") {
      message = null;
    }
  } else {
    message = null;
  }

  console.log(message);
  try {
    const leader = SharedList.getLeader(Number(listId));

    if (!leader) {
      if (userRole !== "OWNER") {
        return res.status(403).json({
          message:
            "Non c'è ancora un Leader in questa lista. Solo il proprietario (OWNER) può modificare il messaggio.",
        });
      }
    } else {
      if (userId !== leader.userId) {
        return res.status(403).json({
          message: `Solo il Leader attuale della lista (${leader.username}) può modificare questo messaggio!`,
        });
      }
    }

    console.log(message);
    SharedList.updateMessage(Number(listId), message);

    return res.status(200).json({ message: "Message updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};
