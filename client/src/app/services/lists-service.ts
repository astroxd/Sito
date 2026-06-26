import { inject, Injectable, signal } from '@angular/core';
import {
  AnimeStatus,
  ListedAnime,
  ListedAnimeApiRes,
  PrivateAnimeApiRes,
} from '../models/List';
import { APIService } from './apiservice';
import { tap } from 'rxjs';

import { AnimeDetail } from '../models/AnimeDetails';

@Injectable({
  providedIn: 'root',
})
export class ListsService {
  private apiService = inject(APIService);

  listShouldRefetch = signal(false);

  setListShouldRefetech(value: boolean) {
    this.listShouldRefetch.set(value);
  }

  getListedAnimes(status: AnimeStatus, page = 1) {
    return this.apiService.get<ListedAnimeApiRes>(`lists/${status}/${page}`);
  }

  searchAnimes(status: AnimeStatus, query = '', page = 1) {
    return this.apiService
      .get<ListedAnimeApiRes>(`lists/${status}?q=${query}&page=${page}`)
      .pipe(tap((val) => console.log(val)));
  }

  getListedAnime(animeId: number) {
    return this.apiService.get<PrivateAnimeApiRes>(`list/entrie/${animeId}`);
  }

  addAnime(animeStatus: AnimeStatus, animeDetails: AnimeDetail) {
    const {
      id,
      idMal,
      title,
      coverImage,
      episodes,
      nextAiringEpisode,
      duration,
      status,
      genres,
    } = animeDetails;

    return this.apiService.post<{ message: string }>(`list/entrie`, {
      status: animeStatus,
      anime: {
        id,
        idMal,
        title: title.romaji ?? title.english ?? title.native ?? 'NO TITLE',
        coverImage: coverImage.extraLarge ?? coverImage.large,
        episodes: nextAiringEpisode?.episode
          ? nextAiringEpisode.episode - 1
          : (episodes ?? 0),
        duration: duration ?? 0,
        genres,
      },
    });
  }

  removeAnime(animeId: number) {
    return this.apiService.delete(`list/entrie/${animeId}`);
  }

  updateAnime(animeId: number, status: AnimeStatus) {
    return this.apiService.patch(`list/entrie`, {
      animeId,
      status,
    });
  }

  getUserProgress(status: AnimeStatus) {
    return this.apiService.get<{ data: ListedAnime[] }>(
      `list/${status}/progress`,
    );
  }

  addWatchedEpisode(animeId: number, status = AnimeStatus.Watching) {
    return this.apiService.post(`list/${status}/progress/entry/${animeId}`, {});
  }
}
