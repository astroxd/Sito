import { supabase } from "../config/supabaseClient";

export interface Anime {
  animeId: number;
  animeMalId: number;
  animeTitle: string;
  animeCover: string;
  animeEpisodes: number;
  animeAvgEpisodeDuration: number;
  animeGenres: string[];
}

export type StatusType =
  "RELEASING" | "NOT_YET_RELEASED" | "FINISHED" | "CANCELLED";

export interface AnimeDetails {
  id: number;
  idMal?: number;
  title: {
    english?: string;
    romaji: string;
    native: string;
  };
  description?: string;
  format: string;
  studios: {
    nodes: {
      name: string;
    }[];
  };
  startDate: {
    year: number;
    month: number;
    day: number;
  };
  endDate: {
    year: number;
    month: number;
    day: number;
  };
  status: StatusType;
  genres: string[];
  averageScore?: number;
  popularity: number;
  duration?: number;
  coverImage: {
    large: string;
    extraLarge: string;
  };
  favourites: number;
  episodes?: number;
  nextAiringEpisode?: {
    airingAt?: number;
    episode?: number;
  };
}

export const Anime = {
  findAnimeById: async (animeId: number): Promise<Anime | null> => {
    const { data, error } = await supabase
      .from("anime")
      .select(
        `
        animeId: anime_id,
        animeMalId: mal_id,
        animeTitle: title,
        animeCover: cover_url,
        animeEpisodes: episodes,
        animeAvgEpisodeDuration: avg_episode_duration,
        animeGenres: genres
      `,
      )
      .eq("anime_id", animeId)
      .maybeSingle();

    if (error) {
      console.error(`Error in findAnimeById [${error.code}]: ${error.message}`);
      throw error;
    }

    return data;
  },

  animeUpsert: async (anime: Anime): Promise<void> => {
    const { error } = await supabase.from("anime").upsert(
      {
        anime_id: anime.animeId,
        mal_id: anime.animeMalId,
        title: anime.animeTitle,
        cover_url: anime.animeCover,
        episodes: anime.animeEpisodes,
        avg_episode_duration: anime.animeAvgEpisodeDuration,
        genres: anime.animeGenres,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "anime_id" },
    );

    if (error) {
      console.error(`Error in animeUpsert [${error.code}]: ${error.message}`);
      throw error;
    }
  },

  sanitizeAnime: (anime: any) => {
    let { id, idMal, title, coverImage, episodes, duration, genres } = anime;

    if (!id || !idMal || !coverImage) {
      throw new Error("MISSING_PARAMS");
    }

    const animeId = Number(id);
    const animeMalId = Number(idMal);

    if (isNaN(animeId) || isNaN(animeMalId)) {
      throw new Error("INVALID_IDS");
    }

    if (!title || typeof title !== "string" || title.trim() === "") {
      throw new Error("MISSING_TITLE");
    }

    const animeEpisodes =
      typeof episodes === "number" && episodes > 0 ? episodes : 0;
    const animeDuration =
      typeof duration === "number" && duration > 0 ? duration : 0;

    let animeGenres: String[] = [];

    // if (Array.isArray(genres)) {
    //   animeGenres = genres.map((g: any) => String(g).trim()).join(",");
    // } else if (typeof genres === "string") {
    //   animeGenres = genres.trim();
    // }
    if (Array.isArray(genres)) {
      animeGenres = genres;
    } else {
      animeGenres = [];
    }

    const animeCover = coverImage;
    const animeTitle = title.trim();

    return {
      animeId,
      animeMalId,
      animeTitle,
      animeCover,
      animeEpisodes,
      animeAvgEpisodeDuration: animeDuration,
      animeGenres,
    } as Anime;
  },
};
