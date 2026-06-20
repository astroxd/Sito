import { inject, Injectable } from '@angular/core';
import {
  AnimeStatus,
  ListedAnimeApiRes,
  PrivateAnimeApiRes,
} from '../models/List';
import { APIService } from './apiservice';
import { tap } from 'rxjs';
import { AnimeDetails } from './anime-details';
import { AnimeDetail } from '../models/AnimeDetails';

@Injectable({
  providedIn: 'root',
})
export class ListsService {
  private apiService = inject(APIService);

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
    } = animeDetails;

    return this.apiService.post<{ message: string }>(`list/entrie`, {
      status: animeStatus,
      anime: {
        id,
        idMal,
        title: title.romaji ?? title.english ?? title.native ?? 'NO TITLE',
        coverImage: coverImage.extraLarge ?? coverImage.large,
        episodes:
          nextAiringEpisode?.episode ??
          (status === 'FINISHED' && !nextAiringEpisode ? episodes : 0),
        duration: duration ?? 0,
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
}
