import { Request, Response } from "express";
import db from "../config/database";
import {
  AnimeGenre,
  Statistics,
  VALID_GENRES_SET,
} from "../models/statistics.model";

export const getUserStats = (req: Request, res: Response) => {
  /* #swagger.tags = ['Statistics']
     #swagger.description = 'Retrieve comprehensive user viewing metrics including aggregated watch time formatted in days/hours/minutes, genre distribution counters, and day-by-day historic graphs comparing the current week with the previous week.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = { 
        description: 'Statistics retrieved successfully',
        schema: {
          totalWatchTime: {
            rawMinutes: 25400,
            days: 17,
            hours: 15,
            minutes: 20,
            formattedString: "17d 15h 20m"
          },
          dailyHistory: {
            currentWeek: [120, 60, 0, 45, 90, 0, 0],
            previousWeek: [30, 0, 45, 120, 0, 60, 15]
          },
          genres: [
            { genre: "Action", count: 14 },
            { genre: "Adventure", count: 8 }
          ]
        }
     }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;

  try {
    //* get 2 previous weeks data
    const today = new Date();

    //* day index (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const currentDayIdx = today.getDay();
    //* make mondayIdx = 0
    const daysSinceMonday = currentDayIdx === 0 ? 6 : currentDayIdx - 1;

    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - daysSinceMonday);

    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);

    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);

    //* string conversion for sqlite
    const startRangeStr = lastMonday.toISOString().split("T")[0];
    const endRangeStr = thisSunday.toISOString().split("T")[0];

    const userDailyWatchtimes = Statistics.getDailyWatchtimeInRange(
      userId,
      startRangeStr,
      endRangeStr,
    );

    //* Fast look-up map [date, minutes]
    const watchTimeMap = new Map<string, number>(
      userDailyWatchtimes.map((row) => [row.date, row.watchtime]),
    );

    const currentWeekData: number[] = [];
    const previousWeekData: number[] = [];

    for (let i = 0; i < 7; i++) {
      const dLast = new Date(lastMonday);
      dLast.setDate(lastMonday.getDate() + i);
      const dLastStr = dLast.toISOString().split("T")[0];
      previousWeekData.push(watchTimeMap.get(dLastStr) ?? 0);

      const dThis = new Date(thisMonday);
      dThis.setDate(thisMonday.getDate() + i);
      const dThisStr = dThis.toISOString().split("T")[0];
      currentWeekData.push(watchTimeMap.get(dThisStr) ?? 0);
    }

    //* get userTotalTime
    const userTotalTime = Statistics.getUserTotalTime(userId);

    const totalMinutes = userTotalTime ? userTotalTime.totalTime : 0;

    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    //* get user genres
    const userGenres = Statistics.getUserGenres(userId);

    const formattedGenres = userGenres.map((row) => ({
      genre: row.genre,
      count: row.watchedAnimes,
    }));

    return res.status(200).json({
      totalWatchTime: {
        rawMinutes: totalMinutes,
        days: days,
        hours: hours,
        minutes: minutes,
        formattedString: `${days}d ${hours}h ${minutes}m`,
      },
      dailyHistory: {
        currentWeek: currentWeekData,
        previousWeek: previousWeekData,
      },
      genres: formattedGenres,
    });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const trackWatchTime = (
  userId: number,
  episodeDiff: number,
  episodeDuration: number,
) => {
  if (episodeDiff === 0 || !episodeDuration) return;

  const addedMinutes = episodeDiff * episodeDuration;

  db.transaction(() => {
    console.log(userId, addedMinutes);
    Statistics.updateUserTotalTime(userId, addedMinutes);

    Statistics.updateDailyWatchtime(userId, addedMinutes);
  })();
};

export const updateGenreStats = (
  userId: number,
  genres: string[],
  action: "INCREMENT" | "DECREMENT",
) => {
  if (!genres || genres.length === 0) return;

  const valueChange = action === "INCREMENT" ? 1 : -1;

  for (const genre of genres) {
    if (!genre) continue;

    const cleanGenre = genre.trim();

    if (VALID_GENRES_SET.has(cleanGenre)) {
      Statistics.updateUserGenres(
        userId,
        cleanGenre as AnimeGenre,
        valueChange,
      );
    }
  }
};
