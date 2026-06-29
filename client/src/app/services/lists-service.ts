import { computed, inject, Injectable, signal } from '@angular/core';
import {
  AnimeStatus,
  iterableAnimeStatusLabels,
  ListedAnime,
  ListedAnimeApiRes,
  PrivateAnime,
  PrivateAnimeApiRes,
} from '../models/List';
import { APIService } from './apiservice';
import { of, tap } from 'rxjs';

import { AnimeDetail } from '../models/AnimeDetails';

@Injectable({
  providedIn: 'root',
})
export class ListsService {
  private apiService = inject(APIService);

  //* The status of the anime in anime-details.page
  public animeStatus = signal<AnimeStatus | null>(null);

  //*
  public lastEpisodeWatched = signal<{
    animeInfo: PrivateAnime;
    lastEpisodeWatched: number;
  } | null>(null);

  public episodes = signal<number | null>(null);

  //* Record that contains the 3 types of ListedAnime
  public userLists = signal<Record<AnimeStatus, ListedAnime[]>>({
    WATCHING: [],
    COMPLETED: [],
    DROPPED: [],
  });

  //* List of the animes in watching with last episode watched
  public userProgress = signal<ListedAnime[]>([]);

  //* return a computed so it refreshes only if its corresponding status update
  public getSignalByStatus(status: AnimeStatus) {
    return computed(() => this.userLists()[status]);
  }

  loadListedAnimes() {
    iterableAnimeStatusLabels.forEach(({ animeStatus }) => {
      this.searchAnimes(animeStatus).subscribe({
        next: ({ data: listedAnimes }) => {
          this.updateList(animeStatus, listedAnimes);
        },
        error: (err) => {
          console.log(err);
        },
      });
    });
  }

  // getListedAnimes(status: AnimeStatus, page = 1) {
  //   return this.apiService.get<ListedAnimeApiRes>(`lists/${status}/${page}`);
  // }

  searchAnimes(status: AnimeStatus, query = '', page = 1) {
    return this.apiService.get<ListedAnimeApiRes>(
      `lists/${status}?q=${query}&page=${page}`,
    );
  }

  getListedAnime(animeId: number) {
    return this.apiService
      .get<PrivateAnimeApiRes>(`list/entrie/${animeId}`)
      .pipe(
        tap({
          next: ({ data: privateAnime }) => {
            this.animeStatus.set(privateAnime?.status ?? null);
            console.log(privateAnime);
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
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
      genres,
    } = animeDetails;

    return this.apiService
      .post<{ message: string }>(`list/entrie`, {
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
      })
      .pipe(
        tap({
          next: () => {
            // this.getListedAnime(id).subscribe();
            this.animeStatus.set(animeStatus);
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  removeAnime(animeId: number) {
    return this.apiService.delete(`list/entrie/${animeId}`).pipe(
      tap({
        next: () => {
          // this.getListedAnime(animeId).subscribe();
          this.animeStatus.set(null);
          this.getLastEpisodeWatched(animeId).subscribe();
        },
        error: (err) => {
          console.log(err);
        },
      }),
    );
  }

  updateAnime(animeId: number, status: AnimeStatus) {
    if (
      this.lastEpisodeWatched()?.lastEpisodeWatched === this.episodes() &&
      this.animeStatus() === 'COMPLETED'
    ) {
      return of(null);
    }
    return this.apiService
      .patch(`list/entrie`, {
        animeId,
        status,
      })
      .pipe(
        tap({
          next: () => {
            // this.getListedAnime(animeId).subscribe();
            this.animeStatus.set(status);
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  getUserProgress(status = AnimeStatus.Watching) {
    return this.apiService
      .get<{ data: ListedAnime[] }>(`list/${status}/progress`)
      .pipe(
        tap({
          next: ({ data: userProgress }) => {
            this.userProgress.set(userProgress);
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  addWatchedEpisode(animeId: number, status = AnimeStatus.Watching) {
    return this.apiService
      .post(`list/${status}/progress/entry/${animeId}`, {})
      .pipe(
        tap({
          next: () => {
            this.getUserProgress().subscribe();
            this.searchAnimes(AnimeStatus.Completed).subscribe({
              next: ({ data: listedAnimes }) => {
                this.updateList(AnimeStatus.Completed, listedAnimes);
              },
              error: (err) => {
                console.log(err);
              },
            });
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  private updateList(status: AnimeStatus, listedAnimes: ListedAnime[]) {
    this.userLists.update((state) => ({ ...state, [status]: listedAnimes }));
  }

  getLastEpisodeWatched(animeId: number) {
    return this.apiService
      .get<{
        data: { lastEpisodeWatched: number; animeInfo: PrivateAnime };
      }>(`anime/episodes/${animeId}`)
      .pipe(
        tap({
          next: ({ data }) => {
            this.lastEpisodeWatched.set(data);
          },
        }),
      );
  }

  updateWatchedEpisode(animeId: number, episodeTarget: number) {
    return this.apiService
      .post('anime/episodes/watch', {
        animeId,
        episodeTarget,
      })
      .pipe(
        tap({
          next: () => {
            this.getLastEpisodeWatched(animeId).subscribe();
            if (episodeTarget === this.episodes()) {
              this.animeStatus.set(AnimeStatus.Completed);
            }
          },
        }),
      );
  }
}
