export interface Anime {
  id: number;
  title: {
    english?: string;
    romaji?: string;
  };
  episodes?: number;
  nextAiringEpisode?: {
    episode: number;
  };
  popularity: number;
  coverImage?: {
    large?: string;
    extraLarge?: string;
  };
  bannerImage?: string;
  genres: [];
  status: string;
}

export interface ListedAnime {
  user_id: number;
  anime_id: number;
  anime_mal_id: number;
  status: number;
  anime_title: string;
  anime_cover: string;
  anime_episodes: number;
  anime_avg_episode_duration: number;
  last_episode_watched: number;
  added_on: string;
}

export interface ListedAnimeApiRes {
  message: string;
  data: ListedAnime[];
}
