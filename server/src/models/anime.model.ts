import db from "../config/database";

export interface Anime {
  animeId: number;
  animeMalId: number;
  animeTitle?: string;
  animeCover?: string;
  animeEpisodes?: number;
  animeAvgEpisodeDuration?: number;
}

export const Anime = {
  findAnimeById: (animeId: number) => {
    return db
      .prepare(
        `
            SELECT anime_id as animeId, anime_mal_id as animeMalId, anime_title as animeTitle, anime_cover as animeCover, anime_episodes as animeEpisodes, anime_avg_episode_duration as animeAvgEpisodeDuration
            FROM 'Anime' WHERE anime_id = ?`,
      )
      .get(animeId) as Anime | undefined;
  },
};
