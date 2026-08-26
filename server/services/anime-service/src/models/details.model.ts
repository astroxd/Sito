import { IAnime, AnimeDetails } from "#types.js";
import { supabase } from "@anime-hub/common";

const DEFAULT_TITLE = null;

const Anime = {
  upsert: async (anime: IAnime) => {
    const { id, idMal, title, cover, episodes, avgEpisodeDuration, genres } =
      anime;

    const { error } = await supabase.from("anime").upsert(
      {
        anime_id: id,
        mal_id: idMal,
        title: title,
        cover_url: cover,
        episodes: episodes,
        avg_episode_duration: avgEpisodeDuration,
        genres: genres,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "anime_id" },
    );

    if (error) {
      console.error(`Error in Anime.upsert [${error.code}]: ${error.message}`);
      throw error;
    }
  },

  sanitize: (anime: AnimeDetails) => {
    const {
      id,
      idMal,
      title,
      coverImage,
      episodes,
      nextAiringEpisode,
      duration,
      genres,
    } = anime;

    if (!id || !idMal) {
      throw new Error("INVALID_IDS");
    }

    const parsedTitle =
      (title && (title.romaji ?? title.english ?? title.native)) ??
      DEFAULT_TITLE;

    const parsedCover = coverImage.extraLarge ?? coverImage.large;

    const parsedEpisodes = nextAiringEpisode?.episode
      ? nextAiringEpisode.episode - 1
      : (episodes ?? 0);

    const parsedDuration = duration ? (duration < 0 ? 0 : duration) : 0;

    const parsedGenres = genres ?? [];

    return {
      id,
      idMal,
      title: parsedTitle,
      cover: parsedCover,
      episodes: parsedEpisodes,
      avgEpisodeDuration: parsedDuration,
      genres: parsedGenres,
    } as IAnime;
  },
};

export default Anime;
