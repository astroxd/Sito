import { Request, Response } from "express";
import {
  Badge,
  BadgeRank,
  BADGES_LIST,
  rankOrder,
} from "../models/badge.model";
import { Statistics } from "../models/statistics.model";
import { existsSync } from "node:fs";

export const checkAndUnlockBadges = (userId: number) => {
  const unlockedBadges = Badge.getUserBadges(userId);

  //* Fast look-up set
  const alreadyUnlocked = new Set<string>(unlockedBadges.map((b) => b.rankKey));

  //* get user stats (totalTime & genres)
  const totalTime = Statistics.getUserTotalTime(userId);
  const totalMinutes = totalTime ? totalTime.totalTime : 0;

  const userGenres = Statistics.getUserGenres(userId);
  const genresMap = new Map<string, number>(
    userGenres.map((r) => [r.genre, r.watchedAnimes]),
  );

  const userStats = { genres: genresMap, totalMinutes };

  for (const badge of BADGES_LIST) {
    const userProgress = badge.getCurrentValue(userStats);

    //* check every rank
    for (const [rank, threshold] of Object.entries(badge.thresholds)) {
      if (!threshold) continue;

      //* skips already unlocked badge
      if (alreadyUnlocked.has(badge.getRankKey(rank as BadgeRank))) continue;

      //* unlock badge
      if (userProgress >= threshold) {
        Badge.insertUserBadge(userId, badge.id, rank as BadgeRank);
      }
    }
  }
};

const getUserBadgesCatalog = (userId: number) => {
  const unlockedBadges = Badge.getUserBadges(userId);

  //* Fast look-up map {badge.id, [bronze, silver,...]}
  const unlockedBadgesMap = new Map<
    string,
    { ranks: BadgeRank[]; lastUnlockDate: string }
  >();

  unlockedBadges.forEach((b) => {
    if (!unlockedBadgesMap.has(b.badgeId)) {
      unlockedBadgesMap.set(b.badgeId, {
        ranks: [],
        lastUnlockDate: b.unlockedAt, //* getUserBadges is ordered by unlockedAt, so lastUnlockDate is accurate
      });
    }
    unlockedBadgesMap.get(b.badgeId)!.ranks.push(b.rank);
  });

  //* get user stats (totalTime & genres)
  const totalTime = Statistics.getUserTotalTime(userId);
  const totalMinutes = totalTime ? totalTime.totalTime : 0;

  const userGenres = Statistics.getUserGenres(userId);
  const genresMap = new Map<string, number>(
    userGenres.map((r) => [r.genre, r.watchedAnimes]),
  );

  const userStats = { genres: genresMap, totalMinutes };

  //* returns the whole catalog with the unlocked
  return BADGES_LIST.filter((badge) => {
    const userProgress = unlockedBadgesMap.get(badge.id);
    const hasRanks = userProgress && userProgress.ranks.length > 0;

    //* exclude secret & notUnlocked Badges
    if (badge.isSecret && !hasRanks) {
      return false;
    }
    return true;
  }).map((badge) => {
    const userProgress = unlockedBadgesMap.get(badge.id);
    const hasRanks = userProgress && userProgress.ranks.length > 0;

    //* for each badge get the highest rank
    const highestRank = hasRanks
      ? (rankOrder.find((r) => userProgress.ranks.includes(r)) ?? null)
      : null;

    //* find next rank if any
    const availableRanks = Object.keys(badge.thresholds) as BadgeRank[];
    const nextRank = highestRank
      ? availableRanks.find((r) => !userProgress?.ranks.includes(r)) //* first available not unlocked rank
      : availableRanks[0];

    const nextRankThreshold = nextRank ? badge.thresholds[nextRank] : null;
    const currentValue = badge.getCurrentValue(userStats);

    //* progress for next rank
    let progressPercentage = 100;
    if (nextRankThreshold) {
      progressPercentage = parseFloat(
        ((currentValue / nextRankThreshold) * 100).toFixed(1),
      );
      if (progressPercentage > 100) progressPercentage = 100;
    }

    return {
      id: badge.id,
      title: badge.title,
      description: badge.description,
      image: `${badge.id}.png`,
      category: badge.category,
      isSecret: badge.isSecret,
      unlocked: hasRanks,
      highestRankUnlocked: highestRank,
      nextRank: nextRank ?? null,
      nextRankThreshold: nextRankThreshold ?? null,
      currentValue: currentValue,
      progressPercentage: progressPercentage,
      unlockedAt: userProgress ? userProgress.lastUnlockDate : null,
    };
  });
};

export const getUserBadges = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  try {
    const catalog = getUserBadgesCatalog(userId);

    const serverUrl = `${req.protocol}://${req.get("host")}`;

    const catalogWithImages = catalog.map((badge) => {
      let imageUrl = "default.png";
      if (existsSync(`static/badges/${badge.id}.png`)) {
        imageUrl = `${badge.id}.png`;
      }
      return {
        ...badge,
        imageUrl: `${serverUrl}/static/badges/${imageUrl}`,
      };
    });

    return res.status(200).json({ data: catalogWithImages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};
