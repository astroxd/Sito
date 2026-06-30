import { Anime } from 'src/app/models/Anime';

export interface SearchOption {
  name: string;
  showName: string;
}

export interface SearchOptions {
  search?: string;
  genre_in?: string[];
  seasonYear?: string;
  format_in?: string[];
  status_in?: string;
  season?: string;
}

export interface ParamOptions {
  query?: string;
  genres?: string;
  year?: string;
  formats?: string;
  status?: string;
  season?: string;
}

export interface QueryOptions {
  sort?: string;
  page?: number;
  searchOptions?: SearchOptions;
}

export interface SearchResultsData {
  media: Anime[];
  pageInfo: {
    currentPage: number;
    hasNextPage: boolean;
    lastPage: number;
    perPage: number;
    total: number;
  };
}
