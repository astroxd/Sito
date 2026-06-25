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

  try {
    db.transaction(() => {
      // const watchedEpisode = User.findLastEpisodeWatchedByAnimeId(
      //   userId,
      //   Number(animeId),
      // );

      // const privateAnime = List.findPrivateAnimeByAnimeId(
      //   userId,
      //   Number(animeId),
      // );

      // const userProgress = SharedList.findUserAnimeProgressByAnimeId(
      //   Number(listId),
      //   userId,
      //   Number(animeId),
      // );

      // //*Se progress === null, crea Shared List Progress, aggiungi a watching
      // if (!userProgress?.currentEpisode) {
      //   SharedList.insertUserProgress(Number(listId), userId, Number(animeId));

      //   SharedList.updateAnimeLastActivity(Number(listId), Number(animeId));

      //   //* SE non è in private anime aggiungi in watching
      //   if (!privateAnime) {
      //     List.insertPrivateAnime(userId, Number(animeId), "WATCHING");
      //     //*Aggiungi in watched episodes
      //     User.insertAnimeIntoWatchedEpisodes(userId, Number(animeId));

      //     //* SE è in private anime ma ha status dropped, sposta in watching (se è completed non fare niente)
      //   } else if (privateAnime.status === "DROPPED") {
      //     List.updateAnimeStatus(userId, Number(animeId), "WATCHING");

      //     //* Potrei aver tolto tutte le puntate viste da un anime
      //     //* quindi devo risettare a 1 le puntate viste
      //     if (watchedEpisode && watchedEpisode?.lastEpisodeWatched < 1) {
      //       User.updateLastWatchedEpisode(userId, Number(animeId), 1);
      //     }
      //   }
      // }
      // //*Se progress !== null, aggiorna puntata in Shared List Progress
      // else {
      //   const animeEpisodes = Anime.findAnimeById(
      //     Number(animeId),
      //   )?.animeEpisodes;
      //   if (!animeEpisodes) throw new Error("No anime found");

      //   const newCurrentEpisode = userProgress.currentEpisode + 1;

      //   if (newCurrentEpisode <= animeEpisodes) {
      //     SharedList.updateUserProgress(
      //       Number(listId),
      //       userId,
      //       Number(animeId),
      //       newCurrentEpisode,
      //     );

      //     SharedList.updateAnimeLastActivity(Number(listId), Number(animeId));

      //     //* Se in una lista condivisa ho superato le puntate viste da solo aggiorno anche watchedEpisodes
      //     if (
      //       watchedEpisode &&
      //       watchedEpisode?.lastEpisodeWatched < newCurrentEpisode
      //     ) {
      //       User.updateLastWatchedEpisode(
      //         userId,
      //         Number(animeId),
      //         newCurrentEpisode,
      //       );
      //     }
      //     if (animeEpisodes === newCurrentEpisode) {
      //       //* Move anime to completed
      //       List.updateAnimeStatus(userId, Number(animeId), 'COMPLETED');
      //     }
      //     //* Se avevo messo l'anime in dropped dopo che avevo fatto progressi in shared List devo rimetterlo in watching
      //     console.log("CONTROLLO ", privateAnime);
      //     if (privateAnime?.status === 'DROPPED') {
      //       List.updateAnimeStatus(userId, Number(animeId), 'WATCHING');
      //     }
      //   }
      // }
      // 1. Recuperiamo i dati attuali
      const watchedEpisode = User.findLastEpisodeWatchedByAnimeId(
        userId,
        Number(animeId),
      );
      console.log(watchedEpisode);
      const privateAnime = List.findPrivateAnimeByAnimeId(
        userId,
        Number(animeId),
      );
      console.log(privateAnime);
      const userProgress = SharedList.findUserAnimeProgressByAnimeId(
        Number(listId),
        userId,
        Number(animeId),
      );

      console.log(userProgress);

      const anime = Anime.findAnimeById(Number(animeId));
      if (!anime?.animeEpisodes)
        throw new Error("No anime found in local catalog");
      const maxEpisodes = anime.animeEpisodes;

      // 2. Calcoliamo il nuovo episodio basandoci se esisteva già o meno il progresso nella lista condivisa
      let newCurrentEpisode = 1; // Se è il primo click, l'episodio diventa 1 (risolve il Bug 1)

      if (userProgress?.currentEpisode) {
        newCurrentEpisode = userProgress.currentEpisode + 1;
      }

      // Blocco di sicurezza: non posso andare oltre gli episodi totali dell'anime
      if (newCurrentEpisode > maxEpisodes) {
        return res.status(200).json({ message: "Already in par" });
      }

      // 3. AGGIORNAMENTO PROGRESSO CONDIVISO
      if (!userProgress?.currentEpisode) {
        // Primo inserimento: creiamo la riga direttamente impostando l'episodio a 1
        SharedList.insertUserProgress(
          Number(listId),
          userId,
          Number(animeId),
          newCurrentEpisode,
        );
      } else {
        // Aggiornamento della riga esistente
        SharedList.updateUserProgress(
          Number(listId),
          userId,
          Number(animeId),
          newCurrentEpisode,
        );
      }
      SharedList.updateAnimeLastActivity(Number(listId), Number(animeId));

      // 4. AGGIORNAMENTO PROGRESSO PRIVATO DA SOLO (watchedEpisodes)
      if (!watchedEpisode) {
        User.insertAnimeIntoWatchedEpisodes(userId, Number(animeId));
      } else {
        const lastWatchedPrivate = watchedEpisode?.lastEpisodeWatched || 0;
        if (lastWatchedPrivate < newCurrentEpisode) {
          // Se la lista condivisa è più avanti di quello che ho visto da solo, allineo il mio counter privato
          User.updateLastWatchedEpisode(
            userId,
            Number(animeId),
            newCurrentEpisode,
          );
        }
      }

      // 5. GESTIONE STATI AUTOMATICA
      // Calcoliamo lo stato che DOVREBBE avere l'anime in base all'episodio appena raggiunto
      if (privateAnime?.status !== AnimeStatus.Completed) {
        // Calcoliamo lo stato ideale per chi NON l'ha ancora completato privatamente
        const calculatedStatus =
          newCurrentEpisode === maxEpisodes
            ? AnimeStatus.Completed
            : AnimeStatus.Watching;

        if (!privateAnime) {
          // Se non esisteva proprio, lo inseriamo (inizia come WATCHING o COMPLETED se è l'ultima puntata)
          List.insertPrivateAnime(userId, Number(animeId), calculatedStatus);
        } else {
          // Se esisteva (ed era DROPPED o WATCHING), lo aggiorniamo solo se lo stato calcolato è diverso
          if (privateAnime.status !== calculatedStatus) {
            List.updateAnimeStatus(userId, Number(animeId), calculatedStatus);
          }
        }
      }
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
  } = animeDetails;

  try {
    db.transaction(() => {
      //* Ottieni Ruolo utente
      const userRole = SharedList.getUserRole(Number(listId), userId)?.role;
      console.log(userRole);
      if (!userRole || !["OWNER", "EDITOR"].includes(userRole)) {
        return res.status(400).json({
          error: "L'utente non ha i permessi per aggiungere l'anime",
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
      Number(userId),
    )?.role;

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
