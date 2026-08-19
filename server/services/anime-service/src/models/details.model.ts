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
