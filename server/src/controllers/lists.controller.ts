import { Request, Response } from "express";
import { AnimeStatus, List } from "../models/list.model";
import { Anime } from "../models/anime.model";
import db from "../config/database";
import { User } from "../models/user.model";
import { trackWatchTime, updateGenreStats } from "./statistics.controller";
import { checkAndUnlockBadges } from "./badge.controller";
import { stat } from "node:fs";
import { userInfo } from "node:os";

const perPage = 6;

export const getList = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { status, page } = req.params;

  if (!status || !page || Number(page) < 1) {
    return res.status(400).json({ message: "Missing Params" });
  }

  try {
    const animeStatus = getValidStatus(status);
    if (!animeStatus) {
      return res.status(400).json({ message: "Status not valid" });
    }

    const offset = (Number(page) - 1) * perPage;

    const list = List.findAllByStatus(userId, animeStatus, perPage, offset);

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
    const animeStatus = getValidStatus(status);
    if (!animeStatus) {
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
    const animeStatus = getValidStatus(status);
    if (!animeStatus) {
      return res.status(404).json({ message: "Status not valid" });
    }

    const { animeId, animeAvgEpisodeDuration, animeEpisodes } =
      Anime.sanitizeAnime(anime);

    db.transaction(() => {
      Anime.animeUpsert(Anime.sanitizeAnime(anime));

      const listedAnime = List.findPrivateAnimeByAnimeId(userId, animeId);

      if (listedAnime) {
        return res
          .status(400)
          .json({ message: "Quest'anime è già in una lista" });
      }

      List.insertPrivateAnime(userId, animeId, status);

      if (animeStatus === AnimeStatus.Completed) {
        const totalAnimeMinutes = animeEpisodes! * animeAvgEpisodeDuration!;
        if (totalAnimeMinutes > 0) {
          trackWatchTime(userId, animeEpisodes!, animeAvgEpisodeDuration!);
        }

        const genresArray = Array.isArray(anime.genres)
          ? anime.genres.map((g: string) => g.trim())
          : [];

        //* Aumento il count dei generi dell'anime appena finito
        updateGenreStats(userId, genresArray, "INCREMENT");

        //* Controllo se ha sbloccato dei badge
        checkAndUnlockBadges(userId);
      }

      //* Aggiungo l'anime in watched Episodes perché così mi spunta sul profilo,
      //* in sharedList non lo faccio senno mi spunterebbero sul profilo tutti gli anime delle shared list,
      //* invece lì li aggiungo quando effettivamente segno la puntata
      User.insertAnimeIntoWatchedEpisodes(userId, animeId, 0);
    })();
    //TODO forse il return dentro la transaction mi fa arrivare qui
    return res
      .status(200)
      .json({ message: "Added Anime to list successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

export const updateAnimeList = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { animeId, status } = req.body;

  const animeStatus = getValidStatus(status);
  if (!animeStatus) {
    return res.status(400).json({ message: "Anime not found in your list" });
  }

  if (isNaN(Number(animeId))) {
    return res.status(400).json({ message: "Invalid Anime ID" });
  }

  try {
    db.transaction(() => {
      const oldStatus = List.findPrivateAnimeByAnimeId(userId, animeId)?.status;

      if (!oldStatus) {
        return res.status(404).json({ message: "No anime in private lists" });
      }

      const currentProgress =
        User.findLastEpisodeWatchedByAnimeId(userId, animeId)
          ?.lastEpisodeWatched ?? 0;
      const animeInfo = Anime.findAnimeById(animeId);

      const genresArray = animeInfo?.animeGenres
        ? animeInfo.animeGenres.split(",").map((g) => g.trim())
        : [];

      if (animeStatus === AnimeStatus.Completed) {
        if (animeInfo?.animeEpisodes && animeInfo.animeAvgEpisodeDuration) {
          const episodeDiff = animeInfo?.animeEpisodes - currentProgress;

          trackWatchTime(
            userId,
            episodeDiff,
            animeInfo.animeAvgEpisodeDuration,
          );
        }

        //* Aumento il count dei generi dell'anime appena finito
        updateGenreStats(userId, genresArray, "INCREMENT");
      } else if (oldStatus === AnimeStatus.Completed) {
        if (animeInfo?.animeEpisodes && animeInfo.animeAvgEpisodeDuration) {
          const episodeDiff = currentProgress - animeInfo?.animeEpisodes;

          trackWatchTime(
            userId,
            episodeDiff,
            animeInfo.animeAvgEpisodeDuration,
          );
        }
        //* Abbasso il count dei generi dell'anime passato in watching
        updateGenreStats(userId, genresArray, "DECREMENT");
      }

      //* Controllo se ha sbloccato dei badge
      checkAndUnlockBadges(userId);
      List.updateAnimeStatus(userId, animeId, animeStatus);
    })();
    //TODO forse il return dentro la transaction mi fa arrivare qui
    return res.status(200).json({ message: "Updated Anime list" });
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

  if (isNaN(Number(animeId))) {
    return res.status(400).json({ message: "Invalid Anime ID" });
  }

  try {
    db.transaction(() => {
      const oldStatus = List.findPrivateAnimeByAnimeId(
        userId,
        Number(animeId),
      )?.status;

      if (!oldStatus) {
        return res
          .status(404)
          .json({ message: "Anime not found in your list" });
      }

      const currentProgress =
        User.findLastEpisodeWatchedByAnimeId(userId, Number(animeId))
          ?.lastEpisodeWatched ?? 0;
      const animeInfo = Anime.findAnimeById(Number(animeId));

      const genresArray = animeInfo?.animeGenres
        ? animeInfo.animeGenres.split(",").map((g) => g.trim())
        : [];

      if (animeInfo && animeInfo.animeAvgEpisodeDuration) {
        let episodesToSubtract = 0;

        if (oldStatus === AnimeStatus.Completed) {
          episodesToSubtract = animeInfo.animeEpisodes!;

          updateGenreStats(userId, genresArray, "DECREMENT");
        } else {
          episodesToSubtract = currentProgress;
        }

        if (episodesToSubtract > 0) {
          trackWatchTime(
            userId,
            -episodesToSubtract,
            animeInfo.animeAvgEpisodeDuration,
          );
        }
      }

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
    const animeStatus = getValidStatus(status);
    if (!animeStatus) {
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

  if (isNaN(Number(animeId))) {
    return res.status(400).json({ message: "Invalid Anime ID" });
  }

  try {
    const anime = Anime.findAnimeById(Number(animeId));
    if (!anime?.animeEpisodes) {
      return res
        .status(404)
        .json({ message: "No anime found in local catalog" });
    }
    const maxEpisodes = anime.animeEpisodes;

    const privateAnime = List.findPrivateAnimeByAnimeId(
      userId,
      Number(animeId),
    );

    if (!privateAnime) {
      return res.status(404).json({ message: "Anime not found in your list" });
    }

    if (privateAnime.status === AnimeStatus.Completed) {
      return res.status(400).json({ message: "Anime is already completed" });
    }

    const watchedEpisode = User.findLastEpisodeWatchedByAnimeId(
      userId,
      Number(animeId),
    );

    const genresArray = anime?.animeGenres
      ? anime.animeGenres.split(",").map((g) => g.trim())
      : [];

    let newCurrentEpisode = 1; //* Default se è la prima volta che clicca l'anime

    if (watchedEpisode?.lastEpisodeWatched) {
      newCurrentEpisode = watchedEpisode.lastEpisodeWatched + 1;
    }

    if (newCurrentEpisode > maxEpisodes) {
      return res.status(200).json({ message: "Already completed or in par" });
    }

    db.transaction(() => {
      if (anime.animeAvgEpisodeDuration) {
        trackWatchTime(userId, 1, anime.animeAvgEpisodeDuration);
      }

      //* Update privato
      User.updateLastWatchedEpisode(userId, Number(animeId), newCurrentEpisode);

      //* Update stato anime
      //* Se sono arrivato fin qui vuol dire che animeStatus = Watching o Dropped
      //* in entrambi i casi lo stato deve diventare Watching o Completed
      let calculatedStatus = AnimeStatus.Watching;
      if (newCurrentEpisode === maxEpisodes) {
        calculatedStatus = AnimeStatus.Completed;
        updateGenreStats(userId, genresArray, "INCREMENT");
      }

      checkAndUnlockBadges(userId);

      List.updateAnimeStatus(userId, Number(animeId), calculatedStatus!);
    })();

    return res.status(200).json({
      message: "Private progress updated successfully",
      currentEpisode: newCurrentEpisode,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const syncAnime = (req: Request, res: Response) => {
  const { anime } = req.body;
  if (!anime) {
    return res.status(400).json({ message: "Missing Params" });
  }

  console.log(anime);

  try {
    const cleanAnime = Anime.sanitizeAnime(anime);

    Anime.animeUpsert(cleanAnime);

    return res.status(200).json({ message: "Anime Sync" });
  } catch (error) {
    console.log(error);
    const clientErrors = ["MISSING_PARAMS", "INVALID_IDS", "MISSING_TITLE"];
    if (clientErrors.includes(error.message)) {
      return res.status(400).json({ message: "Missing Params" });
    }

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

export const updateLastWatchedEpisode = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { animeId, episodeTarget } = req.body;

  if (
    isNaN(Number(animeId)) ||
    isNaN(Number(episodeTarget)) ||
    Number(episodeTarget) < 0
  ) {
    return res.status(400).json({ message: "Invalid or missing parameters" });
  }

  try {
    const anime = Anime.findAnimeById(animeId);
    if (!anime || !anime.animeEpisodes) {
      return res
        .status(404)
        .json({ message: "Anime not found in local catalog" });
    }

    if (episodeTarget > anime.animeEpisodes) {
      return res.status(400).json({
        message: `Target episode cannot exceed max episodes (${anime.animeEpisodes})`,
      });
    }

    const privateAnime = List.findPrivateAnimeByAnimeId(userId, animeId);
    if (!privateAnime) {
      return res.status(404).json({ message: "Anime not found in your list" });
    }

    const genresArray = anime.animeGenres
      ? anime.animeGenres.split(",").map((g) => g.trim())
      : [];

    db.transaction(() => {
      const currentProgress =
        User.findLastEpisodeWatchedByAnimeId(userId, animeId)
          ?.lastEpisodeWatched ?? 0;

      const episodeDiff = episodeTarget - currentProgress;
      if (episodeDiff !== 0) {
        trackWatchTime(userId, episodeDiff, anime.animeAvgEpisodeDuration!);
      }

      User.updateLastWatchedEpisode(userId, animeId, episodeTarget);

      if (
        episodeTarget >= anime.animeEpisodes! &&
        anime.animeEpisodes! > 0 &&
        privateAnime.status !== AnimeStatus.Completed
      ) {
        List.updateAnimeStatus(userId, Number(animeId), AnimeStatus.Completed);
        updateGenreStats(userId, genresArray, "INCREMENT");
      } else if (privateAnime.status === AnimeStatus.Dropped) {
        List.updateAnimeStatus(userId, Number(animeId), AnimeStatus.Watching);
      }

      checkAndUnlockBadges(userId);
    })();

    return res.status(200).json({ message: "Updated" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

export const getLastWatchedEpisode = (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { animeId } = req.params;

  if (isNaN(Number(animeId))) {
    return res.status(400).json({ message: "Invalid Anime ID" });
  }

  try {
    const lastEpisodeWatched = User.findLastEpisodeWatchedByAnimeId(
      userId,
      Number(animeId),
    );

    const privateAnime = List.findPrivateAnimeByAnimeId(
      userId,
      Number(animeId),
    );

    return res.status(200).json({
      data: {
        lastEpisodeWatched: lastEpisodeWatched?.lastEpisodeWatched ?? 0,
        animeInfo: privateAnime ?? null,
      },
    });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "INTERNAL SERVER ERROR",
  });
};

const getValidStatus = (status: any) => {
  const animeStatus = (status as string).toUpperCase() as AnimeStatus;
  if (Object.values(AnimeStatus).includes(animeStatus)) {
    return animeStatus;
  }

  return null;
};
