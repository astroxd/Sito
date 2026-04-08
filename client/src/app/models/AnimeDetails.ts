export interface AnimeDetail {
  id: number;
  idMal: number;
  title: {
    english?: string;
    romaji?: string;
    native?: string;
  };
  description?: string;
  format: string;
  studios: {
    nodes: [
      {
        name: string;
      },
    ];
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
  status: string;
  genres: string[];
  averageScore?: number;
  popularity: number;
  duration?: number;
  coverImage: {
    extraLarge: string;
    large: string;
  };
  favourites: number;
  episodes?: number;
  nextAiringEpisode: {
    airingAt?: number;
  } | null;
}

export interface AnimeTag {
  id: number;
  name: string;
}

export interface AnimeRecommendation {
  id: number;
  title: {
    english?: string;
    romaji?: string;
  };
  status: string;
  popularity: number;
  coverImage: {
    extraLarge: string;
  };
  bannerImage: string;
  episodes?: number;
  nextAiringEpisode: {
    airingAt?: number;
    episode: number;
  } | null;
}
