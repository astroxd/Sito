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
