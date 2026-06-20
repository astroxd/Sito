import { Request, Response } from "express";
import { AnimeStatus, List } from "../models/list.model";
import { Anime } from "../models/anime.model";
import db from "../config/database";
import { User } from "../models/user.model";

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
      hasNextPage = list[0].length > Number(page) * perPage;
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
      hasNextPage = list[0].length > p * perPage;
    }

    return res
      .status(200)
      .json({ data: list, page: p, perPage: perPage, hasNextPage });
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
      //* invece lì li aggiungo quando effettivamente segno la punta
      User.insertAnimeIntoWatchedEpisodes(userId, id, 0);
    })();
    res.status(200).json({ message: "Added Anime to list successfully" });
    return;
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
