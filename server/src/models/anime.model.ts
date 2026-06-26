import db from "../config/database";

export interface Anime {
  animeId: number;
  animeMalId: number;
  animeTitle?: string;
  animeCover?: string;
  animeEpisodes?: number;
  animeAvgEpisodeDuration?: number;
  animeGenres: string;
}

export const Anime = {
  findAnimeById: (animeId: number) => {
    return db
      .prepare(
        `
            SELECT anime_id as animeId, anime_mal_id as animeMalId, anime_title as animeTitle, anime_cover as animeCover, anime_episodes as animeEpisodes, anime_avg_episode_duration as animeAvgEpisodeDuration, anime_genres as animeGenres
            FROM 'Anime' WHERE anime_id = ?`,
      )
      .get(animeId) as Anime | undefined;
  },

  animeUpsert: (anime: Anime) => {
    const {
      animeId,
      animeMalId,
      animeTitle,
      animeCover,
      animeEpisodes,
      animeAvgEpisodeDuration,
      animeGenres,
    } = anime;

    db.prepare(
      `INSERT INTO Anime (anime_id, anime_mal_id, anime_title, anime_cover, anime_episodes, anime_avg_episode_duration, anime_genres) VALUES(?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (anime_id)
        DO UPDATE SET anime_title = @title, anime_cover = @cover, anime_episodes = @episodes, anime_avg_episode_duration = @duration`,
    ).run(
      animeId,
      animeMalId,
      animeTitle,
      animeCover,
      animeEpisodes,
      animeAvgEpisodeDuration,
      animeGenres,
      {
        title: animeTitle,
        cover: animeCover,
        episodes: animeEpisodes,
        duration: animeAvgEpisodeDuration,
      },
    );
  },
};
