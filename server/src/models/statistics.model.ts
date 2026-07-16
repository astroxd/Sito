import db from "../config/database";
import { dbPool, supabase } from "../config/supabaseClient";

export type AnimeGenre =
  | "Action"
  | "Adventure"
  | "Comedy"
  | "Drama"
  | "Ecchi"
  | "Fantasy"
  | "Horror"
  | "Mahou Shoujo"
  | "Mecha"
  | "Music"
  | "Mystery"
  | "Psychological"
  | "Romance"
  | "Sci-Fi"
  | "Slice of Life"
  | "Sports"
  | "Supernatural"
  | "Thriller"
  | "Hentai";

export const VALID_GENRES_SET = new Set<string>([
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
  "Hentai",
]);

export interface UserTotalTime {
  userId: number;
  totalTime: number;
}

export interface UserGenre {
  userId: number;
  genre: AnimeGenre;
  watchedAnimes: number;
}

export interface UserDailyWatchtime {
  userId: number;
  date: string;
  watchtime: number;
}

export const Statistics = {
  getUserTotalTime: async (userId: number): Promise<UserTotalTime | null> => {
    const { data, error } = await supabase
      .from("statistics")
      .select(
        `
        userId: user_id,
        totalTime: total_time
      `,
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(
        `Error in getUserTotalTime [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return data;
  },
  getUserGenres: async (userId: number): Promise<UserGenre[]> => {
    const { data, error } = await supabase
      .from("genre")
      .select(
        `
        userId: user_id,
        genre,
        watchedAnimes: watched_animes
      `,
      )
      .eq("user_id", userId)
      .gt("watched_animes", 0);

    if (error) {
      console.error(`Error in getUserGenres [${error.code}]: ${error.message}`);
      throw error;
    }

    return data || [];
  },

  getDailyWatchtimeInRange: async (
    userId: number,
    start: string,
    end: string,
  ): Promise<UserDailyWatchtime[]> => {
    const { data, error } = await supabase
      .from("daily_watch_time")
      .select(
        `
        userId: user_id,
        date,
        watchtime: watch_time
      `,
      )
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    if (error) {
      console.error(
        `Error in getDailyWatchtimeInRange [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return data || [];
  },

  updateUserTotalTime: async (
    userId: number,
    deltaMinutes: number,
  ): Promise<void> => {
    const client = await dbPool.connect();

    try {
      const query = `
        INSERT INTO statistics (user_id, total_time) 
        VALUES ($1, GREATEST(0, $2))
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          total_time = GREATEST(0, statistics.total_time + $2),
          updated_at = NOW()
      `;

      await client.query(query, [userId, deltaMinutes]);
    } catch (error) {
      console.error(`Error in updateUserTotalTime:`, error);
      throw error;
    } finally {
      client.release();
    }
  },

  updateDailyWatchtime: async (
    userId: number,
    deltaMinutes: number,
  ): Promise<void> => {
    const client = await dbPool.connect();

    try {
      const query = `
        INSERT INTO daily_watch_time (user_id, date, watch_time) 
        VALUES ($1, CURRENT_DATE, GREATEST(0, $2))
        ON CONFLICT (user_id, date) 
        DO UPDATE SET 
          watch_time = GREATEST(0, daily_watch_time.watch_time + $2),
          updated_at = NOW()
      `;

      await client.query(query, [userId, deltaMinutes]);
    } catch (error) {
      console.error(`Error in updateDailyWatchtime:`, error);
      throw error;
    } finally {
      client.release();
    }
  },

  updateUserGenres: async (
    userId: number,
    genre: AnimeGenre,
    deltaAnimeCount: number,
  ): Promise<void> => {
    const client = await dbPool.connect();

    try {
      const query = `
        INSERT INTO genre (user_id, genre, watched_animes) 
        VALUES ($1, $2, GREATEST(0, $3))
        ON CONFLICT (user_id, genre) 
        DO UPDATE SET 
          watched_animes = GREATEST(0, genre.watched_animes + $3),
          updated_at = NOW()
      `;

      await client.query(query, [userId, genre, deltaAnimeCount]);
    } catch (error) {
      console.error(`Error in updateUserGenres:`, error);
      throw error;
    } finally {
      client.release();
    }
  },
};
