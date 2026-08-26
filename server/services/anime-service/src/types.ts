export interface GraphQLQuery {
  query: string;
  variables: {
    [key: string]: number | string | string[];
  };
}

export interface BaseGraphQLResponse {
  errors?: {
    message: string;
    status: number;
    locations: { line: number; column: number }[];
  }[];
}

export type StatusType =
  "RELEASING" | "NOT_YET_RELEASED" | "FINISHED" | "CANCELLED";

interface Tag {
  id: number;
  name: string;
}

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
  tags: Tag[];
}

export interface AnimeDetailsResponse extends BaseGraphQLResponse {
  data: {
    Media: AnimeDetails | null;
  };
}

export interface AnimeRecommendation {
  id: number;
  title: {
    english?: string;
    romaji: string;
  };
  status: string;
  popularity: number;
  coverImage: {
    large: string;
    extraLarge: string;
  };
  bannerImage: string;
  episodes?: number;
  nextAiringEpisode: {
    airingAt?: number;
    episode: number;
  } | null;
  genres: string[];
}

export interface AnimeRecommendationResponse extends BaseGraphQLResponse {
  data: {
    Media: {
      recommendations: {
        edges: {
          node: {
            mediaRecommendation: AnimeRecommendation;
          };
        }[];
      };
    } | null;
  };
}

export interface AnimeCharacter {
  image: {
    large: string;
  };
  name: {
    first: string;
    middle?: string;
    last: string;
  };
  role: string;
  voiceActors: {
    image?: {
      large: string;
    };
    languageV2?: string;

    name?: {
      full: string;
    };
  }[];
}

export interface AnimeCharacterResponse extends BaseGraphQLResponse {
  data: {
    Media: {
      characters: {
        edges: {
          node: {
            image: AnimeCharacter["image"];
            name: AnimeCharacter["name"];
          };
          role: AnimeCharacter["role"];
          voiceActors: AnimeCharacter["voiceActors"];
        }[];
        pageInfo: {
          hasNextPage: boolean;
        };
      };
    };
  };
}

export interface AnimeCharacterRes {
  characters: AnimeCharacter[];
  pageInfo: {
    hasNextPage: boolean;
  };
}

export interface AnimeEpisode {
  mal_id: number;
  episode: string;
  title: string;
  url: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
}

export interface AnimeEpisodeResponse {
  pagination: {
    has_next_page: boolean;
    last_visible_page: number;
  };
  data: AnimeEpisode[];
}

export interface IAnime {
  id: number;
  idMal: number;
  title: string | null;
  cover: string;
  episodes: number;
  avgEpisodeDuration: number;
  genres: string[];
}
