import { Request, Response } from "express";
import { AnimeStatus, List } from "../models/list.model";
import { Anime } from "../models/anime.model";
import db from "../config/database";
import { User } from "../models/user.model";
import { trackWatchTime, updateGenreStats } from "./statistics.controller";
import { checkAndUnlockBadges } from "./badge.controller";

const perPage = 6;

export const getList = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Retrieve a paginated list of anime from the user\'s private list, filtered by status.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['status'] = { in: 'path', type: 'string', required: true, description: 'Anime status (WATCHING, COMPLETED, DROPPED)' }
     #swagger.parameters['page'] = { in: 'path', type: 'integer', required: true, description: 'Page number' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/PaginatedPrivateListResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { status, page } = req.params;

  if (!status || !page || Number(page) < 1) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const animeStatus = getValidStatus(status);
    if (!animeStatus) {
      return res.status(400).json({ message: "Status not valid" });
    }

    const offset = (Number(page) - 1) * perPage;

    const list = await List.findAllByStatus(
      userId,
      animeStatus,
      perPage,
      offset,
    );

    let hasNextPage = false;

    if (list.totalCount > 0) {
      hasNextPage = list.totalCount > Number(page) * perPage;
    }

    return res.status(200).json({
      data: list.items,
      count: list.totalCount,
      page: Number(page),
      perPage: perPage,
      hasNextPage,
    });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const searchInList = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Search for anime inside the user\'s private list filtering by status and title query.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['status'] = { in: 'path', type: 'string', required: true, description: 'Anime status' }
     #swagger.parameters['q'] = { in: 'query', type: 'string', required: true, description: 'Search query string' }
     #swagger.parameters['page'] = { in: 'query', type: 'integer', required: false, description: 'Page number' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/PaginatedPrivateListResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { status } = req.params;

  if (!status) {
    return res.status(400).json({ message: "Missing parameters" });
  }
  try {
    const animeStatus = getValidStatus(status);
    if (!animeStatus) {
      return res.status(400).json({ message: "Status not valid" });
    }

    const { q, page } = req.query;
    const p = parseInt((page as string) ?? 1);
    const offset = (p - 1) * perPage;

    const list = await List.findByAnimeTitle(
      userId,
      animeStatus,
      perPage,
      offset,
      String(q),
    );

    let hasNextPage = false;

    if (list.totalCount > 0) {
      hasNextPage = list.totalCount > p * perPage;
    }

    return res.status(200).json({
      data: list.items,
      count: list.totalCount,
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

export const getAnimeInList = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Check and retrieve details of a specific anime entry in the user\'s private list.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['animeId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the anime' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/SinglePrivateAnimeResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { animeId } = req.params;

  if (!animeId) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const listedAnime = await List.findPrivateAnimeByAnimeId(
      userId,
      Number(animeId),
    );

    return res.status(200).json({ data: listedAnime ?? null });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const addAnimeToList = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Add an anime to the user\'s private tracking list. Handles statistics, genre tracking, and badge verification if marked as COMPLETED.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'AddAnimePrivateBody',
        description: 'Status and complete anime details to save',
        required: true,
        schema: { $ref: '#/definitions/AddAnimePrivateBody' }
     }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { status, anime } = req.body;
  if (!status || !anime) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const animeStatus = getValidStatus(status);
    if (!animeStatus) {
      return res.status(404).json({ message: "Status not valid" });
    }

    const { animeId, animeAvgEpisodeDuration, animeEpisodes } =
      Anime.sanitizeAnime(anime);

    // db.transaction(() => {
    await Anime.animeUpsert(Anime.sanitizeAnime(anime));

    const listedAnime = await List.findPrivateAnimeByAnimeId(userId, animeId);

    if (listedAnime) {
      return res
        .status(400)
        .json({ message: "This anime is already in a list" });
    }

    await List.insertPrivateAnime(userId, animeId, status);

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
    await User.insertAnimeIntoWatchedEpisodes(userId, animeId, 0);
    // })();
    //TODO forse il return dentro la transaction mi fa arrivare qui
    return res
      .status(200)
      .json({ message: "Added Anime to list successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateAnimeList = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Update the tracking status of an anime entry within the user\'s private list. Recalculates statistics, watch time, and genre counters based on status transition.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'UpdateAnimeListBody',
        description: 'Anime ID and the new status to apply',
        required: true,
        schema: { $ref: '#/definitions/UpdateAnimeListBody' }
     }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
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
    // db.transaction(() => {
    const oldStatus = await List.findPrivateAnimeByAnimeId(
      userId,
      animeId,
    ).then((s) => s?.status);

    if (!oldStatus) {
      return res.status(404).json({ message: "No anime in private lists" });
    }

    const currentProgress =
      (await User.findLastEpisodeWatchedByAnimeId(userId, animeId)) ?? 0;
    const animeInfo = await Anime.findAnimeById(animeId);

    const genresArray = animeInfo?.animeGenres || [];

    if (animeStatus === AnimeStatus.Completed) {
      if (animeInfo?.animeEpisodes && animeInfo.animeAvgEpisodeDuration) {
        const episodeDiff = animeInfo?.animeEpisodes - currentProgress;

        trackWatchTime(userId, episodeDiff, animeInfo.animeAvgEpisodeDuration);
      }

      //* Aumento il count dei generi dell'anime appena finito
      updateGenreStats(userId, genresArray, "INCREMENT");
    } else if (oldStatus === AnimeStatus.Completed) {
      if (animeInfo?.animeEpisodes && animeInfo.animeAvgEpisodeDuration) {
        const episodeDiff = currentProgress - animeInfo?.animeEpisodes;

        trackWatchTime(userId, episodeDiff, animeInfo.animeAvgEpisodeDuration);
      }
      //* Abbasso il count dei generi dell'anime passato in watching
      updateGenreStats(userId, genresArray, "DECREMENT");
    }

    //* Controllo se ha sbloccato dei badge
    checkAndUnlockBadges(userId);
    await List.updateAnimeStatus(userId, animeId, animeStatus);
    // })();
    //TODO forse il return dentro la transaction mi fa arrivare qui
    return res.status(200).json({ message: "Updated Anime list successfully" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const deleteAnimeFromList = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Remove an anime entirely from the user\'s private list. Deducts watch time and rolls back related statistics.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['animeId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the anime to delete' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { animeId } = req.params;

  if (isNaN(Number(animeId))) {
    return res.status(400).json({ message: "Invalid Anime ID" });
  }

  try {
    // db.transaction(() => {
    const oldStatus = await List.findPrivateAnimeByAnimeId(
      userId,
      Number(animeId),
    ).then((s) => s?.status);

    if (!oldStatus) {
      return res.status(404).json({ message: "Anime not found in your list" });
    }

    const currentProgress =
      (await User.findLastEpisodeWatchedByAnimeId(userId, Number(animeId))) ??
      0;
    const animeInfo = await Anime.findAnimeById(Number(animeId));

    const genresArray = animeInfo?.animeGenres || [];

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

    await List.deleteByAnimeId(userId, Number(animeId));

    await User.deleteFromWatchingByAnimeId(userId, Number(animeId));
    // })();

    return res
      .status(200)
      .json({ message: "Deleted Anime from list successfully" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const getUserAnimesProgress = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Retrieve the comprehensive playback and episode tracking progress for all anime in a specified tracking status.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['status'] = { 
        in: 'path', 
        type: 'string', 
        required: true, 
        description: 'Anime tracking status filter',
        enum: ['WATCHING', 'COMPLETED', 'DROPPED'] 
     }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/UserAnimesProgressResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const { status } = req.params;
  const userId = res.locals.userId;

  try {
    const animeStatus = getValidStatus(status);
    if (!animeStatus) {
      return res.status(400).json({ message: "Status not valid" });
    }
    const userAnimesProgress = await List.findAnimesProgressByUserId(
      userId,
      animeStatus,
    );

    return res.status(200).json({ data: userAnimesProgress });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateUserProgress = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Increment the private tracking progress of an anime entry by exactly +1 episode. Updates status to COMPLETED and adds statistics if max episodes are reached.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['status'] = { in: 'path', type: 'string', required: true, description: 'Current list status' }
     #swagger.parameters['animeId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the anime to increment' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/UpdateProgressSuccessResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { animeId } = req.params;

  if (isNaN(Number(animeId))) {
    return res.status(400).json({ message: "Invalid Anime ID" });
  }

  try {
    const anime = await Anime.findAnimeById(Number(animeId));
    if (!anime?.animeEpisodes) {
      return res
        .status(404)
        .json({ message: "No anime found in local catalog" });
    }
    const maxEpisodes = anime.animeEpisodes;

    const privateAnime = await List.findPrivateAnimeByAnimeId(
      userId,
      Number(animeId),
    );

    if (!privateAnime) {
      return res.status(404).json({ message: "Anime not found in your list" });
    }

    if (privateAnime.status === AnimeStatus.Completed) {
      return res.status(400).json({ message: "Anime is already completed" });
    }

    const watchedEpisode = await User.findLastEpisodeWatchedByAnimeId(
      userId,
      Number(animeId),
    );

    const genresArray = anime?.animeGenres || [];

    let newCurrentEpisode = 1; //* Default se è la prima volta che clicca l'anime

    if (watchedEpisode) {
      newCurrentEpisode = watchedEpisode + 1;
    }

    if (newCurrentEpisode > maxEpisodes) {
      return res.status(200).json({ message: "Already completed or in par" });
    }

    // db.transaction(() => {
    if (anime.animeAvgEpisodeDuration) {
      trackWatchTime(userId, 1, anime.animeAvgEpisodeDuration);
    }

    //* Update privato
    await User.updateLastWatchedEpisode(
      userId,
      Number(animeId),
      newCurrentEpisode,
    );

    //* Update stato anime
    //* Se sono arrivato fin qui vuol dire che animeStatus = Watching o Dropped
    //* in entrambi i casi lo stato deve diventare Watching o Completed
    let calculatedStatus = AnimeStatus.Watching;
    if (newCurrentEpisode === maxEpisodes) {
      calculatedStatus = AnimeStatus.Completed;
      updateGenreStats(userId, genresArray, "INCREMENT");
    }

    checkAndUnlockBadges(userId);

    await List.updateAnimeStatus(userId, Number(animeId), calculatedStatus!);
    // })();

    return res.status(200).json({
      message: "Private progress updated successfully",
      currentEpisode: newCurrentEpisode,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const syncAnime = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Anime Metadata']
     #swagger.description = 'Synchronize or upsert sanitized anime data into the local catalog/database mapping.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'SyncAnimeBody',
        description: 'Raw anime details from external provider to sanitize and sync',
        required: true,
        schema: { $ref: '#/definitions/SyncAnimeBody' }
     }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const { anime } = req.body;
  if (!anime) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const cleanAnime = Anime.sanitizeAnime(anime);

    await Anime.animeUpsert(cleanAnime);

    return res.status(200).json({ message: "Anime synced successfully" });
  } catch (error) {
    console.error(error);
    const clientErrors = ["MISSING_PARAMS", "INVALID_IDS", "MISSING_TITLE"];
    if (clientErrors.includes(error.message)) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateLastWatchedEpisode = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Bulk update or manually set the exact target episode reached by the user. Automatically shifts status to COMPLETED if the target matches or exceeds max episodes, recalculating stats accordingly.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'BulkWatchBody',
        description: 'Anime ID and target episode number',
        required: true,
        schema: { $ref: '#/definitions/BulkWatchBody' }
     }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[404] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
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
    const anime = await Anime.findAnimeById(animeId);
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

    const privateAnime = await List.findPrivateAnimeByAnimeId(userId, animeId);
    if (!privateAnime) {
      return res.status(404).json({ message: "Anime not found in your list" });
    }

    const genresArray = anime.animeGenres || [];

    // db.transaction(() => {
    const currentProgress =
      (await User.findLastEpisodeWatchedByAnimeId(userId, animeId)) ?? 0;

    const episodeDiff = episodeTarget - currentProgress;
    if (episodeDiff !== 0) {
      trackWatchTime(userId, episodeDiff, anime.animeAvgEpisodeDuration!);
    }

    await User.updateLastWatchedEpisode(userId, animeId, episodeTarget);

    if (
      episodeTarget >= anime.animeEpisodes! &&
      anime.animeEpisodes! > 0 &&
      privateAnime.status !== AnimeStatus.Completed
    ) {
      await List.updateAnimeStatus(
        userId,
        Number(animeId),
        AnimeStatus.Completed,
      );
      updateGenreStats(userId, genresArray, "INCREMENT");
    } else if (privateAnime.status === AnimeStatus.Dropped) {
      await List.updateAnimeStatus(
        userId,
        Number(animeId),
        AnimeStatus.Watching,
      );
    }

    checkAndUnlockBadges(userId);
    // })();

    return res
      .status(200)
      .json({ message: "Episode tracking updated successfully" });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

export const getLastWatchedEpisode = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Anime Episodes']
     #swagger.description = 'Retrieve the last tracked episode alongside full listing metadata for a specific anime inside the user\'s private list.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['animeId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the anime' }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/LastWatchedEpisodeResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const { animeId } = req.params;

  if (isNaN(Number(animeId))) {
    return res.status(400).json({ message: "Invalid Anime ID" });
  }

  try {
    const [lastEpisodeWatched, privateAnime] = await Promise.all([
      User.findLastEpisodeWatchedByAnimeId(userId, Number(animeId)),
      List.findPrivateAnimeByAnimeId(userId, Number(animeId)),
    ]);

    return res.status(200).json({
      data: {
        lastEpisodeWatched: lastEpisodeWatched ?? 0,
        animeInfo: privateAnime,
      },
    });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({
    message: "Internal server error",
  });
};

const getValidStatus = (status: any) => {
  const animeStatus = (status as string).toUpperCase() as AnimeStatus;
  if (Object.values(AnimeStatus).includes(animeStatus)) {
    return animeStatus;
  }

  return null;
};
