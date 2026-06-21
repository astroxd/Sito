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
