export enum AnimeStatus {
  Watching = 'WATCHING',
  Completed = 'COMPLETED',
  Dropped = 'DROPPED',
}

export const AnimeStatusLabels: Record<AnimeStatus, string> = {
  [AnimeStatus.Watching]: 'Watching',
  [AnimeStatus.Completed]: 'Completed',
  [AnimeStatus.Dropped]: 'Dropped',
};

export interface PrivateAnime {
  userId: number;
  animeId: number;
  status: AnimeStatus;
  addedOn?: string;
}

export interface PrivateAnimeApiRes {
  data: PrivateAnime | null;
}

export interface ListedAnime {
  userId: number;
  animeId: number;
  animeMalId: number;
  status: AnimeStatus;
  animeTitle: string;
  animeCover: string;
  animeEpisodes: number;
  // anime_avg_episode_duration: number;
  lastEpisodeWatched: number;
  addedOn: string;
}

export interface ListedAnimeApiRes {
  message: string;
  data: ListedAnime[];
  page: number;
  perPage: number;
  hasNextPage: boolean;
}
