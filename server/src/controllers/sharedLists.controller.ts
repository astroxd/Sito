import { Request, Response } from "express";
import {
  Anime,
  AnimeProgress,
  SharedList,
  SharedListAnime,
  SharedListMember,
} from "../models/sharedList.model";
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
