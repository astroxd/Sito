export interface Anime {
  id: number;
  idMal?: number;
  title: {
    english?: string;
    romaji: string;
  };
  episodes?: number;
  nextAiringEpisode?: {
    episode?: number;
    airingAt?: number;
  } | null;
  popularity: number;
  coverImage: {
    large: string;
    extraLarge: string;
  };
  bannerImage?: string;
  genres: string[];
  status: string;
  duration?: number;
}
