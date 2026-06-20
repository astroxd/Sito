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
  const { listId } = req.params;
  const userId = res.locals.userId;
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
  const userId = res.locals.userId;

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
      const userRole = SharedList.getUserRole(Number(listId), userId);

      if (!userRole || userRole > 1) {
        res.status(400).json({
          error: "L'utente non ha i permessi per aggiungere l'anime",
        });
        return;
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

      // const animeUpsert = db
      //   .prepare(
      //     `INSERT INTO Anime (anime_id, anime_mal_id, anime_title, anime_cover, anime_episodes, anime_avg_episode_duration) VALUES(?, ?, ?, ?, ?, ?)
      //   ON CONFLICT (anime_id)
      //   DO UPDATE SET anime_title = @title, anime_cover = @cover, anime_episodes = @episodes, anime_avg_episode_duration = @duration`,
      //   )
      //   .run(animeId, idMal, title, coverImage, episodes, duration, {
      //     title: title,
      //     cover: coverImage,
      //     episodes: episodes,
      //     duration: duration,
      //   });
      // console.log("Anime Upsert: ", animeUpsert);

      //* Aggiungi anime in SharedListAnime
      // const resp = db
      //   .prepare(
      //     "INSERT INTO 'Shared List Anime'(shared_list_id,anime_id,added_on,last_activity_at) VALUES(?,?, datetime('now'), datetime('now'))",
      //   )
      //   .run(listId, animeId);
      // console.log("Shared List Anime: ", resp);

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
