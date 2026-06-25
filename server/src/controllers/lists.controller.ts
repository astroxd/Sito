import { Request, Response } from "express";
import { AnimeStatus, List } from "../models/list.model";
import { Anime } from "../models/anime.model";
import db from "../config/database";
import { User } from "../models/user.model";
import { stat } from "node:fs";

const perPage = 6;

export const getList = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { status, page } = req.params;

  if (!status || !page || Number(page) < 1) {
    return res.status(400).json({ message: "Missing Params" });
  }

  try {
    const animeStatus = (status as string).toUpperCase() as AnimeStatus;
    if (!Object.values(AnimeStatus).includes(animeStatus)) {
      return res.status(400).json({ message: "Status not valid" });
    }

    const offset = (Number(page) - 1) * perPage;

    const list = List.findAllByStatus(userId, animeStatus, perPage, offset);
    console.log(list);

    let hasNextPage = false;

    if (list.length > 0) {
      hasNextPage = list[0].length! > Number(page) * perPage;
    }

    return res.status(200).json({
      data: list,
      page: Number(page),
      perPage: perPage,
      hasNextPage,
    });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const searchInList = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { status } = req.params;

  if (!status) {
    return res.status(400).json({ message: "Missing Params" });
  }
  try {
    const animeStatus = (status as string).toUpperCase() as AnimeStatus;
    if (!Object.values(AnimeStatus).includes(animeStatus)) {
      return res.status(400).json({ message: "Status not valid" });
    }

    const { q, page } = req.query;
    const p = parseInt((page as string) ?? 1);
    const offset = (p - 1) * perPage;

    const list = List.findByAnimeTitle(
      userId,
      animeStatus,
      perPage,
      offset,
      String(q),
    );

    let hasNextPage = false;

    if (list.length > 0) {
      hasNextPage = list[0].length! > p * perPage;
    }

    return res.status(200).json({ data: list, page: p, perPage, hasNextPage });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const getAnimeInList = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { animeId } = req.params;

  if (!animeId) {
    return res.status(400).json({ message: "Missing Params" });
  }

  try {
    const listedAnime = List.findPrivateAnimeByAnimeId(userId, Number(animeId));

    return res.status(200).json({ data: listedAnime ?? null });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const addAnimeToList = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { status, anime } = req.body;
  if (!status || !anime) {
    return res.status(400).json({ message: "Missing Params" });
  }

  try {
    const animeStatus = (status as string).toUpperCase() as AnimeStatus;
    if (!Object.values(AnimeStatus).includes(animeStatus)) {
      return res.status(400).json({ message: "Status not valid" });
    }

    const { id, idMal, title, coverImage, episodes, duration } = anime;

    db.transaction(() => {
      Anime.animeUpsert({
        animeId: id,
        animeMalId: idMal,
        animeTitle: title,
        animeCover: coverImage,
        animeEpisodes: episodes,
        animeAvgEpisodeDuration: duration,
      });

      List.insertPrivateAnime(userId, id, status);

      //* Aggiungo l'anime in watched Episodes perché così mi spunta sul profilo,
      //* in sharedList non lo faccio senno mi spunterebbero sul profilo tutti gli anime delle shared list,
      //* invece lì li aggiungo quando effettivamente segno la puntata
      User.insertAnimeIntoWatchedEpisodes(userId, id, 0);
    })();
    return res
      .status(200)
      .json({ message: "Added Anime to list successfully" });
  } catch (error) {
    console.log(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const updateAnimeList = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { animeId, status } = req.body;

  try {
    const animeStatus = (status as string).toUpperCase() as AnimeStatus;
    if (!Object.values(AnimeStatus).includes(animeStatus)) {
      return res.status(400).json({ message: "Status not valid" });
    }

    List.updateAnimeStatus(userId, animeId, animeStatus);

    res.status(200).json({ message: "Updated Anime list" });
    return;
  } catch (error) {
    console.log(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const deleteAnimeFromList = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { animeId } = req.params;

  try {
    db.transaction(() => {
      List.deleteByAnimeId(userId, Number(animeId));

      User.deleteFromWatchingByAnimeId(userId, Number(animeId));
    })();

    res.status(200).json({ message: "Deleted Anime from list" });
    return;
  } catch (error) {
    console.log(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const getUserAnimesProgress = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  const { status } = req.params;

  try {
    const animeStatus = (status as string).toUpperCase() as AnimeStatus;
    if (!Object.values(AnimeStatus).includes(animeStatus)) {
      return res.status(400).json({ message: "Status not valid" });
    }
    const userAnimesProgress = List.findAnimesProgressByUserId(
      userId,
      animeStatus,
    );

    return res.status(200).json({ data: userAnimesProgress });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

export const updateUserProgress = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { animeId } = req.params;

  try {
    // 1. Recuperiamo i dettagli dell'anime per sapere il numero massimo di episodi
    const anime = Anime.findAnimeById(Number(animeId));
    if (!anime?.animeEpisodes) {
      return res
        .status(404)
        .json({ message: "No anime found in local catalog" });
    }
    const maxEpisodes = anime.animeEpisodes;

    // 2. Recuperiamo il progresso privato attuale dell'utente (episodi visti)
    const watchedEpisode = User.findLastEpisodeWatchedByAnimeId(
      userId,
      Number(animeId),
    );

    // Recuperiamo lo stato dell'anime nella lista privata dell'utente
    const privateAnime = List.findPrivateAnimeByAnimeId(
      userId,
      Number(animeId),
    );

    // 3. Calcoliamo il nuovo episodio
    let newCurrentEpisode = 1; // Default se è la prima volta che clicca l'anime

    if (watchedEpisode?.lastEpisodeWatched) {
      newCurrentEpisode = watchedEpisode.lastEpisodeWatched + 1;
    }

    // Blocco di sicurezza: non si può andare oltre gli episodi totali dell'anime
    if (newCurrentEpisode > maxEpisodes) {
      return res.status(200).json({ message: "Already completed or in par" });
    }

    // Usiamo una transazione per essere sicuri che entrambi gli update vadano a buon fine insieme
    db.transaction(() => {
      // 4. AGGIORNAMENTO PROGRESSO PRIVATO (Watched Episodes)
      // Visto che nella tua 'addAnimeToList' crei già la riga a 0, qui facciamo sempre un UPDATE sicuro
      User.updateLastWatchedEpisode(userId, Number(animeId), newCurrentEpisode);

      // 5. GESTIONE STATO AUTOMATICO E AGGIORNAMENTO TIMESTAMP (Private Anime)
      // Se l'utente raggiunge l'ultima puntata lo stato diventa COMPLETED, altrimenti rimane WATCHING
      // (Evitiamo di sovrascrivere se l'utente lo aveva messo manualmente in DROPPED, a meno che non stia guardando l'ultima puntata)
      let calculatedStatus = privateAnime?.status;
      if (newCurrentEpisode === maxEpisodes) {
        calculatedStatus = AnimeStatus.Completed;
      } else if (privateAnime?.status !== AnimeStatus.Completed) {
        calculatedStatus = AnimeStatus.Watching;
      }
      List.updateAnimeStatus(userId, Number(animeId), calculatedStatus!);
    })();

    return res.status(200).json({
      message: "Private progress updated successfully",
      currentEpisode: newCurrentEpisode,
    });
  } catch (error) {
    console.error("Errore aggiornamento progresso privato:", error);
    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};
