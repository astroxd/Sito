export interface Anime {
  id: number;
  idMal: number;
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
  duration: number;
}
